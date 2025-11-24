const API_URL = 'https://yachtmanagementsuite.com/api';

export async function getVessels() {
  const response = await fetch(`${API_URL}/vessels`);
  return response.json();
}

export async function getBookings() {
  const response = await fetch(`${API_URL}/bookings`);
  return response.json();
}

export async function createBooking(booking: any) {
  const response = await fetch(`${API_URL}/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(booking)
  });
  return response.json();
}
