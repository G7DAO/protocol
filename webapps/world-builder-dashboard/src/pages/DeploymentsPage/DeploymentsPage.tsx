import { ContentHeader } from 'summon-ui'
import { Box, Text } from 'summon-ui/mantine'

const DESCRIPTION =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed auctor justo at mauris placerat, id vehicula justo vulputate. Fusce ut semper libero. In hac habitasse platea dictumst. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Mauris vel tortor vel libero eleifend tincidunt'

const DeploymentsPage = () => {
  return (
    <Box px='md'>
      <ContentHeader name='Deployments' />
      <Text>{DESCRIPTION}</Text>
    </Box>
  )
}

export default DeploymentsPage
