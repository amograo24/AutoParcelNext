import axios from "axios";

export default async function sendMessage(
  parcel_obj: Object,
  otp: string,
  type: string
) {
  try {
    console.log("sending message to twilio");
    let body = "";

    if (type.toLowerCase().trim() == "c") {
      //@ts-ignore
      body = `Dear ${parcel_obj.OwnerName},\nYour parcel ${parcel_obj.ParcelID} has arrived at Gate 1 at ${parcel_obj.ReceivedAt}.\n Kindly use ${otp} as your AutoParcel One Time Password (OTP) to collect your parcel.`;
    } else if (type.toLowerCase().trim() == "h") {
      //@ts-ignore
      body = `Dear ${parcel_obj.OwnerName},\nYour parcel ${parcel_obj.ParcelID} has been collected from Gate 1 at ${parcel_obj.CollectedAt}.\n Thank you for using AutoParcel :)`;
    } else {
      body = "AutoParcel OTP";
    }
    const Data = {
      //@ts-ignore
      body_text: body, //@ts-ignore
      recipient: parcel_obj.ParcelReceiver.PhoneNumber,
    };
    const headers = {
      "Content-Type": "application/json",
    };

    const result = await axios
      .post("http://pythonserver-ftnw.onrender.com/twilio", Data, { headers })
      // .post("http://127.0.0.1:8000/twilio", Data, { headers })
      .then((res) => {
        console.log("resssssssss", res.data);
      })
      .catch((error) => {
        console.error("Failed to send a message", error);
      });
    return result;
  } catch (err) {
    console.log(err);
  }
}
