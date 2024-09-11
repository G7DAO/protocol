import styles from './ProjectSelector.module.css'
import { Combobox, Group, InputBase, InputBaseProps, useCombobox } from 'summon-ui/mantine'
import IconCheck from '@/assets/IconCheck'
import IconChevronDown from '@/assets/IconChevronDown'


type ProjectSelectorProps = {
  projects: any[]
  selectedProject: any
  onChange: (project: any) => void
} & InputBaseProps

const ProjectSelector = ({ projects, onChange, selectedProject }: ProjectSelectorProps) => {
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption()
  })

  return (
    <Combobox
      store={combobox}
      variant='unstyled'
      onOptionSubmit={(val: string) => {
        const newSelection = projects.find((n) => String(n.chainId) === val)
        if (newSelection) {
          onChange(newSelection)
        }
        combobox.closeDropdown()
      }}
      classNames={{ options: styles.options, option: styles.option, dropdown: styles.dropdown }}
    >
      <Combobox.Target>
        <InputBase
          component='button'
          className={styles.inputBase}
          pointer
          variant='unstyled'
          rightSection={projects.length > 1 ? <IconChevronDown className={styles.chevron} /> : ''}
          rightSectionPointerEvents='none'
          onClick={() => combobox.toggleDropdown()}
        >
          <span className={styles.inputBaseNetworkName}>{selectedProject.displayName}</span>
        </InputBase>
      </Combobox.Target>
      <Combobox.Dropdown className='!bg-dark-900 !rounded-md !border-dark-700'>
        <Combobox.Options>
          {projects
            .sort((a, b) => {
              if (a.chainId === selectedProject.chainId) return 1
              if (b.chainId === selectedProject.chainId) return -1
              return 0
            })
            .map((n) => (
              <Combobox.Option value={String(n.chainId)} key={n.chainId}>
                <Group>
                  <div
                    className={
                      n.chainId === selectedProject.chainId ? styles.optionContainerSelected : styles.optionContainer
                    }
                  >
                    <div className={styles.optionLeftSection}>
                      {n.displayName}
                    </div>
                    {n.chainId === selectedProject.chainId && <IconCheck />}
                  </div>
                </Group>
              </Combobox.Option>
            ))}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  )
}
export default ProjectSelector
