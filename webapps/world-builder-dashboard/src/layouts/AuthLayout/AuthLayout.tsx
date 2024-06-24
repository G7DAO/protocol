import { Outlet } from 'react-router-dom'
import { Flex } from 'summon-ui/mantine'

const AuthLayout = () => {
  return (
    <Flex h='100vh' align='center' justify='center'>
      <Outlet />
    </Flex>
  )
}

export default AuthLayout
