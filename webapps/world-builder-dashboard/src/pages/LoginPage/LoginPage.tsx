import { Box, useForm, TextInput, Button } from "summon-ui/mantine";
import { ContentHeader, useMediaScreen } from "summon-ui";
import { useLogin } from "@/hooks/userHooks";
import { useAuthState } from "@/providers/AuthProvider";
import { useNavigate } from "react-router-dom";

interface SignInValues {
  email: string;
  password: string;
}
const LoginPage = () => {
  const navigate = useNavigate();
  const isMobile = useMediaScreen({ breakpoint: "mobile" });
  const { mutateAsync, isLoading } = useLogin();
  const { login } = useAuthState();
  const {
    getInputProps,
    onSubmit: onSubmitForm,
    values,
  } = useForm<SignInValues>({
    initialValues: {
      email: "guille@email.com",
      password: "******",
    },
  });

  const handleSubmit = async (data: typeof values) => {
    const user = await mutateAsync({
      email: data.email,
      password: data.password,
    });
    login(user);
    navigate("/deployments");
  };
  return (
    <Box p="xl" w={isMobile ? "90%" : "40%"}>
      <ContentHeader name="Sign in" />
      <form onSubmit={onSubmitForm(handleSubmit)}>
        <TextInput
          {...getInputProps("email")}
          label="Email"
          placeholder="Email"
          value={values.email}
          disabled
        />
        <TextInput
          type="password"
          {...getInputProps("password")}
          label="Password"
          placeholder="Password"
          value={values.password}
          disabled
        />
        <Button
          type="submit"
          loading={isLoading}
          disabled={isLoading}
          w="100%"
          mt="xl"
        >
          Sign in
        </Button>
      </form>
    </Box>
  );
};

export default LoginPage;
