import { FC } from "react";
import { Spinner } from "summon-ui";
import { Box } from "summon-ui/mantine";
import useAuth from "./useAuth";

const withAuth = (WrappedComponent: FC) => {
  const NewComponent: FC = () => {
    const { finishedAuthenticating } = useAuth();

    if (!finishedAuthenticating) {
      return (
        <Box className="h-screen">
          <Spinner />
        </Box>
      );
    }

    return <WrappedComponent />;
  };

  NewComponent.displayName = "withAuth";

  return NewComponent;
};

export default withAuth;
