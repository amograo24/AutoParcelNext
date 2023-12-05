"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Oval } from "react-loader-spinner";
import { FaCamera } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import React, { useState } from "react";
import Webcam from "react-webcam";
import usePrediction from "@/hooks/usePrediction";
import Fuse from "fuse.js";
import {
  getReceivers,
  getVendors,
  addVendor,
  generatePID,
  addParcel,
  getParcelOTP,
} from "@/utils";
// @ts-ignore
var receiver = null;
// @ts-ignore
var vendor = null;

function performDBMatch(list: any, query: string, key: string) {
  const options = {
    includeScore: true,
    threshold: 0.5,
    algorithms: ["levenshtein", "jaro-winkler"],
    keys: [
      {
        name: key,
      },
    ],
  };
  const fuse = new Fuse(list, options);
  return fuse.search(query);
}
function getOrdinalNum(n: number) {
  return (
    n +
    (n > 0
      ? ["th", "st", "nd", "rd"][(n > 3 && n < 21) || n % 10 > 3 ? 0 : n % 10]
      : "")
  );
}
const getDate = () => {
  let date = new Date();
  let currentDayOrdinal = getOrdinalNum(date.getDate());
  let currentMonth = date.toLocaleString("default", { month: "long" });

  let currentYear = date.getFullYear();

  let currentDate = `${currentDayOrdinal} ${currentMonth} ${currentYear}`;
  return currentDate;
};
const formSchema = z.object({
  OwnerName: z.string().min(2, {
    message: "Name must be at least 3 characters.",
  }),
  Date: z.date(),
  ParcelCompany: z.string(),
  ParcelNumber: z.string(),
  PhoneNumber: z.string(),
  RoomNumber: z.string(),
  OwnerID: z.string(),
  Shelf: z.string(),
  Comment: z.string(),
});
const FACING_MODE_ENVIRONMENT = "environment";

// const FACING_MODE_USER = "user";
const Page = () => {
  const router = useRouter();
  const fillform = async (data: any) => {
    form.setValue("OwnerName", data.OwnerName);
    form.setValue("ParcelCompany", data.ParcelCompany);
    form.setValue("ParcelNumber", data.ParcelNumber);
    form.setValue("PhoneNumber", data.PhoneNumber);
    form.setValue("RoomNumber", data.RoomNumber);
    form.setValue("OwnerID", data.OwnerID);
  };
  interface Iprediction {
    label: string;
    page: number;
    value: string;
    confidence: number;
  }

  const Callapi = async (img: any) => {
    const receivers = await getReceivers({});
    const vendors = await getVendors({});

    //solve this
    const predictionstr = await usePrediction(img);
    const emptydata: { [key: string]: [string | number, number] } = {
      OwnerName: ["", 0.0],
      ParcelCompany: ["", 0.0],
      ParcelNumber: ["", 0.0],
      RoomNumber: [0, 0.0],
      OwnerID: ["", 0.0],
    };
    const data: any = {
      OwnerName: "",
      ParcelCompany: "",
      ParcelNumber: "",
      RoomNumber: 0,
      OwnerID: "",
    };
    console.log(predictionstr);
    if (predictionstr != undefined) {
      const predictions = JSON.parse(predictionstr);
      predictions.forEach((prediction: Iprediction) => {
        if (
          prediction.confidence > 0.0 &&
          emptydata[prediction.label][1] < prediction.confidence
        ) {
          emptydata[prediction.label] = [
            prediction.value,
            prediction.confidence,
          ];
          data[prediction.label] = prediction.value;
        }
      });

      const receiver_result = performDBMatch(
        receivers,
        data.OwnerName,
        "OwnerName"
      );
      const vendor_result = performDBMatch(
        vendors,
        data.ParcelCompany,
        "ParcelCompany"
      );
      console.log(receiver_result);
      console.log(vendor_result);
      if (receiver_result.length > 0) {
        const ref_index = receiver_result[0].refIndex;
        receiver = receivers[ref_index];
        data.OwnerID = receiver.OwnerID;
        data.OwnerName = receiver.OwnerName;
        data.PhoneNumber = receiver.PhoneNumber;
        // what if the room number parameter is missing?
        data.RoomNumber = receiver.RoomNumber;
      }
      if (vendor_result.length > 0) {
        const ref_index = vendor_result[0].refIndex;
        vendor = vendors[ref_index];
        data.ParcelCompany = vendor.ParcelCompany;
      } else {
        // create a new vendor if there is some textual data from the form
        if (data.ParcelCompany.length > 0) {
          vendor = await addVendor({ ParcelCompany: data.ParcelCompany });
          // data.ParcelCompany = vendor.ParcelCompany;
        } else {
          vendor = { VendorID: null };
        }
      }

      fillform({
        // @ts-ignore
        OwnerName: "", // @ts-ignore
        ParcelCompany: "", // @ts-ignore
        ParcelNumber: "",
        PhoneNumber: "", // @ts-ignore
        RoomNumber: "", // @ts-ignore
        OwnerID: "",
        Comment: "",
        ...data,
      });
    } else {
      console.log("no predictions");
    }
    setLoading(false);
  };

  const [loading, setLoading] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      OwnerName: "", //
      ParcelCompany: "",
      ParcelNumber: "", //
      PhoneNumber: "",
      RoomNumber: "",
      OwnerID: "", //
      Shelf: "A", //
      Comment: "", //
      Date: new Date(),
    },
  });
  async function onSubmit(values: any) {
    console.log(values);
    // if there's a receiver, then update the parcel without the spare (room number, ph number)
    // if there's no receiver, then update the parcel with the spare.
    // we also need vendor id
    let spare = "";
    // const uid = //generate uid
    delete values.Date;
    // @ts-ignore

    if (receiver == null) {
      spare = `(${values.PhoneNumber}),(${values.RoomNumber}),(${values.OwnerID})`;
      values.OwnerID = null;
    } else {
      // @ts-ignore
      values.OwnerID = receiver.OwnerID;
    }
    // @ts-ignore
    delete values.PhoneNumber;
    delete values.RoomNumber;
    delete values.Date;
    delete values.ParcelCompany;
    // let pid = await generatePID();
    // console.log("pid", pid);
    // @ts-ignore
    values = {
      ...values,
      spare: spare,
      // VendorID: vendor.VendorID,
      ParcelID: await generatePID(),
      otp: getParcelOTP(),
      // otp: getParcelOTP(),
    };

    const new_parcel = await addParcel(values);
    router.push("/parcels/" + new_parcel.ParcelID);
    // if(receiver){
    //   delete values.PhoneNumber;
    //   delete values.RoomNumber;
    //   delete values.OwnerID;
    //   values = {...values, OwnerID: receiver.OwnerID} // parcel id too
    // } else {

    // }
    // @ts-ignore
  }
  const webcamRef: any = React.useRef(null);
  const [image, setImage] = useState("");
  const [camOpen, setCamOpen] = useState(false);
  const opencamera = () => {
    console.log("camera opened");
    setCamOpen(true);
  };

  const capture = React.useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    setLoading(true);
    Callapi(imageSrc);
    setImage(imageSrc);
    setCamOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [webcamRef]);

  let videoConstraints: MediaTrackConstraints = {
    facingMode: FACING_MODE_ENVIRONMENT,
    width: 1000,
    height: 640,
  };

  return (
    <>
      <div className="flex justify-between items-center">
        <h1 className="text-6xl font-bold mt-2">Add a Parcel</h1>
        <div className="flex justify-end place-self-end">
          <div className="font-bold bg-primary_white rounded-md p-3 ">
            {getDate()}
          </div>
        </div>
      </div>
      <div className="flex flex-row justify-between gap-x-10 mt-5">
        <div className="w-full p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="OwnerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parcel Owner</FormLabel>
                    <FormControl>
                      <Input placeholder="Parcel owner name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ParcelCompany"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parcel Company</FormLabel>
                    <FormControl>
                      <Input placeholder="Parcel company name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ParcelNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parcel Number</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="AWB number, order number, etc."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="PhoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="" {...field} type="number" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="RoomNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Room Number</FormLabel>
                    <FormControl>
                      <Input placeholder="000" type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="OwnerID"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Owner ID</FormLabel>
                    <FormControl>
                      <Input placeholder="U20XX0XXX" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="Shelf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Shelf</FormLabel>
                    <FormControl>
                      <Select defaultValue={field.value}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A">Shelf A</SelectItem>
                          <SelectItem value="B">Shelf B</SelectItem>
                          <SelectItem value="C">Shelf C</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="Comment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Comment</FormLabel>
                    <FormControl>
                      <Textarea />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button className="bg-primary_black" type="submit">
                Submit
              </Button>
            </form>
          </Form>
        </div>
        <div className="bg-primary_black w-2 m-6 rounded-lg"></div>
        <div className="w-full">
          <div className=" flex items-center justify-center flex-col mt-24">
            {camOpen ? (
              <>
                <Webcam
                  className="webcam"
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/png"
                  videoConstraints={videoConstraints}
                  screenshotQuality={1}
                />
                <Button className="bg-primary_black" onClick={capture}>
                  Take Picture
                </Button>
              </>
            ) : loading ? (
              <Oval
                height={60}
                width={60}
                color="var(--primary_red)"
                wrapperStyle={{}}
                wrapperClass=""
                visible={true}
                ariaLabel="oval-loading"
                secondaryColor="var(--primary_red)"
                strokeWidth={6}
                strokeWidthSecondary={3}
              />
            ) : (
              <>
                <FaCamera className="w-60 h-60 fill-primary_black" />
                <Button
                  className="m-4 bg-primary_black"
                  type="button"
                  onClick={opencamera}
                >
                  {image ? "Retake" : "Scan Label"}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Page;
