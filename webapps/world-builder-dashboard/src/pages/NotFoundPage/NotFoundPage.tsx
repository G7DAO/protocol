import { useNavigate } from 'react-router-dom'
import { Icon, IconName } from 'summon-ui'
import { Container, Stack, Title, Group, Text, Button } from 'summon-ui/mantine'
import { useIsMobile } from '@/utils/utils'

const NotFoundPage = () => {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  return (
    <Container>
      <Stack h='100vh' justify='center' align={isMobile ? 'center' : 'flex-start'}>
        <Text size='md' c='red.9' fw='bold' ta={isMobile ? 'center' : 'left'}>
          404 Not found
        </Text>
        <Title order={3} ta={isMobile ? 'center' : 'left'}>{`We can't find that page`}</Title>
        <Text size='sm' c='gray.5' ta={isMobile ? 'center' : 'left'}>
          {` Sorry, the page you are looking for doesn't exist or has been moved.`}
        </Text>
        <Group>
          <Button
            variant='outline'
            color='gray.5'
            size='md'
            onClick={() => navigate(-1)}
            leftSection={<Icon size={20} name={'ArrowLeft' as IconName} />}
          >
            Go Back
          </Button>
          <Button size='md' onClick={() => navigate('/deployments')}>
            Take me home
          </Button>
        </Group>
      </Stack>
    </Container>
  )
}

export default NotFoundPage
