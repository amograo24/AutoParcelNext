import prisma from "@/prisma";
import axios from "axios";
const connectToDb = async () => {
  try {
    await prisma.$connect();
  } catch (err: any) {
    return new Error(err.message);
  }
};

const getParcels = async (func: string, query: any) => {
  const res = await axios.post("/api/get_parcels", {
    func: func,
    query: query,
  });
  return res.data.parcels;
};

const generatePID = async (len: number = 6) => {
  let char_set = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let pid = "AP"+Array.from({ length: len }, () =>
    char_set.charAt(Math.floor(Math.random() * char_set.length))
  ).join("");
  while (await getParcels("findUnique", { ParcelID: pid })) {
    pid = Array.from({ length: len }, () =>
      char_set.charAt(Math.floor(Math.random() * char_set.length))
    ).join("");
  }
  return pid;
};

const addParcel = async (parcel: any) => {
  const res = await axios.post("/api/add_parcel", { data: parcel });
  return res.data.parcel;
};

const addVendor = async (vendor: any) => {
  const res = await axios.post("/api/add_vendor", { data: vendor });
  return res.data.vendor;
};

const getVendors = async (query: any) => {
  const receivers = await axios.post("/api/get_vendors", { query: query });
  return receivers.data.vendors;
};

const getReceivers = async (query: any) => {
  const receivers = await axios.post("/api/get_parcel_recievers", {
    query: query,
  });
  return receivers.data.parcelRecievers;
};

const getParcelOTP = async (len: number = 6) => {
  let char_set = "0123456789";
  const pid = Array.from({ length: len }, () =>
    char_set.charAt(Math.floor(Math.random() * char_set.length))
  ).join("");
  return pid;
};

export {
  getParcels,
  getVendors,
  getReceivers,
  addParcel,
  addVendor,
  generatePID,
  connectToDb,
};
