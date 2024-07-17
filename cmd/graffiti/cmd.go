package main

import (
	"bufio"
	"bytes"
	"errors"
	"io"
	"os"

	"github.com/spf13/cobra"
)

const GraffitiVersion string = "0.0.1"

func CreateRootCommand() *cobra.Command {
	// rootCmd represents the base command when called without any subcommands
	rootCmd := &cobra.Command{
		Use:   "graffiti",
		Short: "graffiti: Tag execution flows in documentation, query execution flows in tests",
		Run: func(cmd *cobra.Command, args []string) {
			cmd.Help()
		},
	}

	completionCmd := CreateCompletionCommand(rootCmd)
	versionCmd := CreateVersionCommand()

	rootCmd.AddCommand(completionCmd, versionCmd)

	tagsCmd := CreateTagsCommand()
	numberCmd := CreateNumberCommand()
	rootCmd.AddCommand(tagsCmd, numberCmd)

	// By default, cobra Command objects write to stderr. We have to forcibly set them to output to
	// stdout.
	rootCmd.SetOut(os.Stdout)

	return rootCmd
}

func CreateTagsCommand() *cobra.Command {
	var infileRaw string
	var showLines bool
	var content []byte
	tagsCmd := &cobra.Command{
		Use:   "tags",
		Short: "Find all tags in the given file",
		PreRunE: func(cmd *cobra.Command, args []string) error {
			var infile *os.File
			if infileRaw == "" {
				infile = os.Stdin
			} else {
				file, fileErr := os.Open(infileRaw)
				if fileErr != nil {
					return fileErr
				}
				defer file.Close()
				infile = file
			}

			var contentErr error
			content, contentErr = io.ReadAll(infile)
			if contentErr != nil {
				return contentErr
			}

			return nil
		},
		RunE: func(cmd *cobra.Command, args []string) error {
			tags := FindTags(content, true)
			linesNeeded := map[int]bool{}
			lines := map[int]string{}
			if showLines {
				// If we need to show lines, let's do one pass to compute the line numbers we need to show.
				for _, labels := range tags {
					for _, label := range labels {
						linesNeeded[label.LineNumber] = true
					}
				}

				// Then let's actually load the lines
				contentReader := bytes.NewReader(content)
				scanner := bufio.NewScanner(contentReader)
				currentLine := 0
				for scanner.Scan() {
					currentLine++
					if linesNeeded[currentLine] {
						lines[currentLine] = scanner.Text()
					}
				}
			}
			for tag, labels := range tags {
				cmd.Printf("Tag: %s, instances: %d\n", tag, len(labels))
				if showLines {
					for _, label := range labels {
						cmd.Printf("- Line %d: %s\n", label.LineNumber, lines[label.LineNumber])
					}
				}
			}

			return nil
		},
	}

	tagsCmd.Flags().StringVarP(&infileRaw, "infile", "i", "", "The file to read tags from. If not provided, reads from stdin.")
	tagsCmd.Flags().BoolVarP(&showLines, "lines", "l", false, "Show the full lines in which each tag occurs")

	return tagsCmd
}

func CreateNumberCommand() *cobra.Command {
	var infileRaw, outfileRaw, tag string
	var content []byte

	numberCmd := &cobra.Command{
		Use:   "number",
		Short: "Number the labels in a file with a given tag",
		PreRunE: func(cmd *cobra.Command, args []string) error {
			if tag == "" {
				return errors.New("-t/--tag must be provided")
			}

			var infile *os.File
			if infileRaw == "" {
				infile = os.Stdin
			} else {
				file, fileErr := os.Open(infileRaw)
				if fileErr != nil {
					return fileErr
				}
				defer file.Close()
				infile = file
			}

			var contentErr error
			content, contentErr = io.ReadAll(infile)
			if contentErr != nil {
				return contentErr
			}

			return nil
		},
		RunE: func(cmd *cobra.Command, args []string) error {
			numberedContent := ApplyNumbering(content, tag)

			var outfile *os.File
			var fileErr error
			if outfileRaw == "" {
				outfile = os.Stdout
			} else {
				outfile, fileErr = os.Create(outfileRaw)
				if fileErr != nil {
					return fileErr
				}
				defer outfile.Close()
			}

			_, writeErr := outfile.Write(numberedContent)
			return writeErr
		},
	}

	numberCmd.Flags().StringVarP(&infileRaw, "infile", "i", "", "The file containing the content to be numbered. If not provided, reads from stdin.")
	numberCmd.Flags().StringVarP(&tag, "tag", "t", "", "The tag to apply numberings to. For a label of the form ABC-xyz, the tag is ABC.")
	numberCmd.Flags().StringVarP(&outfileRaw, "outfile", "o", "", "The file to which to write the content with numbering applied. If not provided, writes to stdout.")

	return numberCmd
}

func CreateCompletionCommand(rootCmd *cobra.Command) *cobra.Command {
	completionCmd := &cobra.Command{
		Use:   "completion",
		Short: "Generate shell completion scripts for graffiti",
		Long: `Generate shell completion scripts for graffiti.

The command for each shell will print a completion script to stdout. You can source this script to get
completions in your current shell session. You can add this script to the completion directory for your
shell to get completions for all future sessions.

For example, to activate bash completions in your current shell:
		$ . <(graffiti completion bash)

To add graffiti completions for all bash sessions:
		$ graffiti completion bash > /etc/bash_completion.d/graffiti_completions`,
	}

	bashCompletionCmd := &cobra.Command{
		Use:   "bash",
		Short: "bash completions for graffiti",
		Run: func(cmd *cobra.Command, args []string) {
			rootCmd.GenBashCompletion(cmd.OutOrStdout())
		},
	}

	zshCompletionCmd := &cobra.Command{
		Use:   "zsh",
		Short: "zsh completions for graffiti",
		Run: func(cmd *cobra.Command, args []string) {
			rootCmd.GenZshCompletion(cmd.OutOrStdout())
		},
	}

	fishCompletionCmd := &cobra.Command{
		Use:   "fish",
		Short: "fish completions for graffiti",
		Run: func(cmd *cobra.Command, args []string) {
			rootCmd.GenFishCompletion(cmd.OutOrStdout(), true)
		},
	}

	powershellCompletionCmd := &cobra.Command{
		Use:   "powershell",
		Short: "powershell completions for graffiti",
		Run: func(cmd *cobra.Command, args []string) {
			rootCmd.GenPowerShellCompletion(cmd.OutOrStdout())
		},
	}

	completionCmd.AddCommand(bashCompletionCmd, zshCompletionCmd, fishCompletionCmd, powershellCompletionCmd)

	return completionCmd
}

func CreateVersionCommand() *cobra.Command {
	versionCmd := &cobra.Command{
		Use:   "version",
		Short: "Print the version of graffiti that you are currently using",
		Run: func(cmd *cobra.Command, args []string) {
			cmd.Println(GraffitiVersion)
		},
	}

	return versionCmd
}
