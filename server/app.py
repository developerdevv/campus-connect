
import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from supabase import create_client, Client
from postgrest import APIError
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

supabase: Client = create_client(
    os.environ.get("SUPABASE_URL"),
    os.environ.get("SUPABASE_KEY")
)


# 1. GET /api/events
# Fetch all events

@app.route("/")
def index():
    return """
        <h1>CampusConnect API</h1>
        <p>Backend is running successfully!</p>
        <p>Available endpoint: /api/events</p>
    """

@app.route("/api/events", methods=["GET"])
def get_events():
    try:
        response = (
            supabase.table("events")
            .select("*")
            .execute()
        )

        return jsonify({
            "success": True,
            "events": response.data
        }), 200

    except APIError as error:
        return jsonify({"error": error.message}), 500


# 2. GET /api/events/<id>
# Fetch event details

@app.route("/api/events/<string:event_id>", methods=["GET"])
def get_event(event_id):
    try:
        response = (
            supabase.table("events")
            .select("*")
            .eq("id", event_id)
            .execute()
        )

        if not response.data:
            return jsonify({"error": "Event not found"}), 404

        return jsonify({
            "success": True,
            "event": response.data[0]
        }), 200

    except APIError as error:
        return jsonify({"error": error.message}), 500


# 3. POST /api/registrations
# Create event registration

@app.route("/api/registrations", methods=["POST"])
def create_registration():
    data = request.get_json(silent=True) or {}

    user_id = data.get("user_id")
    event_id = data.get("event_id")

    if not user_id or not event_id:
        return jsonify({
            "error": "user_id and event_id are required"
        }), 400

    try:
        # Check whether user exists
        user = (
            supabase.table("users")
            .select("id")
            .eq("id", user_id)
            .execute()
        )

        if not user.data:
            return jsonify({"error": "User not found"}), 404

        # Check whether event exists
        event = (
            supabase.table("events")
            .select("*")
            .eq("id", event_id)
            .execute()
        )

        if not event.data:
            return jsonify({"error": "Event not found"}), 404

        # Check duplicate registration
        existing = (
            supabase.table("registrations")
            .select("id")
            .eq("user_id", user_id)
            .eq("event_id", event_id)
            .execute()
        )

        if existing.data:
            return jsonify({
                "error": "Already registered for this event"
            }), 409

        # Check event capacity
        registrations = (
            supabase.table("registrations")
            .select("id", count="exact")
            .eq("event_id", event_id)
            .execute()
        )

        count = registrations.count or 0

        if count >= event.data[0]["capacity"]:
            return jsonify({
                "error": "Event is full"
            }), 409

        # Create registration
        response = (
            supabase.table("registrations")
            .insert({
                "user_id": user_id,
                "event_id": event_id
            })
            .execute()
        )

        return jsonify({
            "success": True,
            "message": "Registration successful",
            "registration": response.data[0]
        }), 201

    except APIError as error:
        return jsonify({"error": error.message}), 500


# 4. GET /api/me/registrations
# Fetch registrations using user_id

@app.route("/api/me/registrations", methods=["GET"])
def get_my_registrations():
    user_id = request.args.get("user_id")

    if not user_id:
        return jsonify({
            "error": "user_id is required"
        }), 400

    try:
        response = (
            supabase.table("registrations")
            .select("*")
            .eq("user_id", user_id)
            .execute()
        )

        return jsonify({
            "success": True,
            "registrations": response.data
        }), 200

    except APIError as error:
        return jsonify({"error": error.message}), 500


# 5. GET /api/events/<id>/registrations
# Fetch all attendees of an event

@app.route(
    "/api/events/<string:event_id>/registrations",
    methods=["GET"]
)
def get_event_registrations(event_id):
    try:
        # Check event existence
        event = (
            supabase.table("events")
            .select("id, title")
            .eq("id", event_id)
            .execute()
        )

        if not event.data:
            return jsonify({"error": "Event not found"}), 404

        # Fetch registrations
        registrations = (
            supabase.table("registrations")
            .select("*")
            .eq("event_id", event_id)
            .execute()
        )

        registration_data = registrations.data

        user_ids = list(set(
            item["user_id"] for item in registration_data
        ))

        attendees = []

        if user_ids:
            users = (
                supabase.table("users")
                .select("id, email")
                .in_("id", user_ids)
                .execute()
            )

            user_map = {
                user["id"]: user["email"]
                for user in users.data
            }

            for item in registration_data:
                attendees.append({
                    "registration_id": item["id"],
                    "user_id": item["user_id"],
                    "email": user_map.get(item["user_id"])
                })

        return jsonify({
            "success": True,
            "event": event.data[0]["title"],
            "total_attendees": len(attendees),
            "attendees": attendees
        }), 200

    except APIError as error:
        return jsonify({"error": error.message}), 500


if __name__ == "__main__":
    app.run(debug=True)