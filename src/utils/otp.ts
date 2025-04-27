export function generateOTP(length = 6): string {
  const otp = Math.random()
    .toString()
    .slice(2, 2 + length);

  return otp;
}

export function generateOTPExpiration(): Date {
  const date = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now
  return date;
}
