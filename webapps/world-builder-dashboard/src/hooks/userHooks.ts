import { LoginData, User } from "@/types";
import { AxiosError } from "axios";
import { useMutation } from "react-query";

const login = async ({ email, password }: LoginData): Promise<User> => {
  // @TODO uncomment when implemented
  // const { data } = await axiosInstance.post("/login", {
  //   email,
  //   password,
  // });
  // return data.data;
  console.log(email, password);
  return Promise.resolve({
    firstName: "Guille",
    lastName: "Antico",
    email: "guille@email.com",
  } as User);
};

const logout = async (): Promise<void> => {
  // await axiosInstance.post("/logout");
  setTimeout(() => Promise.resolve(), 1000);
};

export const useLogout = () => useMutation<void, AxiosError>(logout);
export const useLogin = () =>
  useMutation<User, AxiosError<any, any>, LoginData>(login);
