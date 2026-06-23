const globalForOtp = globalThis as unknown as { otpStore?: Map<string, { otp: string; expires: number }> };
const otpStore = globalForOtp.otpStore ?? (globalForOtp.otpStore = new Map());
export default otpStore;
