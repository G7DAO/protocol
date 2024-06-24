import {
  DashboardLayout as SummonUiDashboardLayout,
  Icon,
  IconName,
} from "summon-ui";
import {
  Box,
  NavLink,
  Stack,
  Badge,
  Flex,
  Avatar,
  Text,
} from "summon-ui/mantine";
import { Outlet, useNavigate } from "react-router-dom";
import { ReactNode } from "react";
import { useAuthState } from "@/providers/AuthProvider";
import withAuth from "@/hocs/withAuth";
import { useAppVersion, useIsDevMode } from "@/utils/utils";

const BOTTOM_MENU = [
  {
    name: "Settings",
    to: "/settings",
    icon: "Settings01" as IconName,
  },
];
const NAVIGATION_MENU: {
  name: string;
  icon: IconName;
  to: string;
  soon?: boolean;
  description?: string;
}[] = [
  {
    name: "Bridge",
    icon: "Wallet04" as IconName,
    to: "/bridge",
  },
  {
    name: "Stake",
    icon: "CoinsStacked03" as IconName,
    to: "/stake",
  },
];

const renderNavigationMenu = ({
  isCollapsed,
  closeMobileMenu,
}: {
  isCollapsed: boolean;
  closeMobileMenu: () => void;
}): ReactNode => {
  return (
    <Stack gap="xs" align={isCollapsed ? "center" : "stretch"} w="100%">
      {NAVIGATION_MENU.map(({ icon, soon, description, ...link }, index) => (
        <NavLink
          leftSection={<Icon name={icon} />}
          fw="900"
          tt="uppercase"
          onClick={closeMobileMenu}
          className="overflow-visible"
          w={isCollapsed ? 50 : "98%"}
          active={index === 0}
          href={link.to}
          key={link.name}
          disabled={soon}
          {...(soon ? { rightSection: <Badge size="xs">Soon</Badge> } : {})}
          {...(isCollapsed ? {} : { label: link.name, description })}
        />
      ))}
    </Stack>
  );
};

const renderBottomMenu = ({
  isCollapsed,
  closeMobileMenu,
}: {
  isCollapsed: boolean;
  closeMobileMenu: () => void;
}): ReactNode => {
  const navigate = useNavigate();
  const { user, logout } = useAuthState();
  const handleLogout = () => {
    logout();
    navigate("/");
  };
  return (
    <>
      <Stack
        gap={4}
        align={isCollapsed ? "center" : "stretch"}
        w="100%"
        mb={42}
      >
        {BOTTOM_MENU.map(({ icon, ...link }, index) => (
          <NavLink
            leftSection={<Icon name={icon} />}
            fw="900"
            tt="uppercase"
            onClick={closeMobileMenu}
            active={index === 3}
            href={link.to}
            key={link.name}
            {...(isCollapsed ? {} : { label: link.name })}
          />
        ))}
      </Stack>

      <Flex
        justify="space-between"
        align="center"
        direction={isCollapsed ? "column" : "row"}
        gap={isCollapsed ? "sm" : 0}
      >
        <Flex align="center" gap="lg">
          <Avatar
            size="md"
            radius="sm"
            src="https://raw.githubusercontent.com/mantinedev/mantine/master/.demo/avatars/avatar-1.png"
          />
          {!isCollapsed && user && (
            <Stack gap={2}>
              <Text size="md">{`${user.firstName} ${user.lastName}`}</Text>
              <Text size="sm">{user.email}</Text>
            </Stack>
          )}
        </Flex>
        <Icon
          name="LogOut01"
          size="md"
          variant="subtle"
          onClick={handleLogout}
        />
      </Flex>
    </>
  );
};

const DashboardLayout = () => {
  const isDev = useIsDevMode();
  const appVersion = useAppVersion();
  return (
    <Box h="100%" mih="100vh" w="100%" className="overflow-y-scroll">
      <SummonUiDashboardLayout
        renderNavigationMenu={renderNavigationMenu}
        renderBottomMenu={renderBottomMenu}
        render={({ offset }: { offset: number }) => (
          <>
            {isDev && (
              <Box
                w="100%"
                p="sm"
                bg="yellow.6"
                c="white"
                ta="right"
              >{`Development mode. version ${appVersion}`}</Box>
            )}
            <Outlet context={{ offset }} />
          </>
        )}
      />
    </Box>
  );
};

export default withAuth(DashboardLayout);
