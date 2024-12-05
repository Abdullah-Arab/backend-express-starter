import axios from "axios";

const isProduction = process.env.NODE_ENV === "production";

export async function sendOTP(phone: string): Promise<string> {
  const res = await axios.post<{pin:string}>(
    `https://otp.sadeem-factory.com/api/v1/pins${isProduction ? "" : "?test="}`,
    {
      phone,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.OTP_API_TOKEN!}`,
      },
    }
  );
  return res.data.pin as string;
}
