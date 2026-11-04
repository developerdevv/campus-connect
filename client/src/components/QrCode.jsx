import { QRCodeSVG } from 'qrcode.react'

// Encodes the registration's ticket code as a real QR code. Validating that
// code at check-in is a backend concern and is not part of this frontend.
export default function QrCode({ value = '', size = 132, className }) {
  return (
    <QRCodeSVG
      value={value}
      size={size}
      level="M"
      marginSize={2}
      bgColor="#ffffff"
      fgColor="#141830"
      className={className}
      role="img"
      aria-label={`QR code containing ticket code ${value}`}
    />
  )
}
