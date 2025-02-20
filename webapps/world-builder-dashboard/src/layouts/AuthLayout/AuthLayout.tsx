import { Outlet } from 'react-router-dom'
import { Flex } from '@mantine/core'

const AuthLayout = () => {
  return (
    <Flex h='100vh' align='center' justify='center'>
      <Outlet />
    </Flex>
  )
}

export default AuthLayout
