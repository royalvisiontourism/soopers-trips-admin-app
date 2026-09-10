"use client";

import toast from "react-hot-toast";

export const notifySuccess = (message) => {
  toast.success(typeof message === "string" ? message : "Success");
};

export const notifyError = (message) => {
  if (typeof message === "string") {
    toast.error(message || "Something went wrong");
  } else if (message instanceof Error) {
    toast.error(message.message || "Something went wrong");
  } else if (typeof message?.message === "string") {
    toast.error(message.message || "Something went wrong");
  } else {
    toast.error("Something went wrong");
  }
};
