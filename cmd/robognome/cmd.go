package main

import (
	"fmt"
	"math/big"
	"os"

	"github.com/ethereum/go-ethereum/common"
	"github.com/spf13/cobra"

	"github.com/G7DAO/protocol/bindings/Metronome"
	"github.com/G7DAO/protocol/cmd/robognome/version"
)

func CreateRootCommand() *cobra.Command {
	// rootCmd represents the base command when called without any subcommands
	rootCmd := &cobra.Command{
		Use:   "robognome",
		Short: "robognome: A bot for Metronome bounties",
		Run: func(cmd *cobra.Command, args []string) {
			cmd.Help()
		},
	}

	completionCmd := CreateCompletionCommand(rootCmd)
	versionCmd := CreateVersionCommand()

	metronomeCmd := Metronome.CreateMetronomeCommand()
	metronomeCmd.Use = "metronome"

	rootCmd.AddCommand(completionCmd, versionCmd, metronomeCmd)

	// By default, cobra Command objects write to stderr. We have to forcibly set them to output to
	// stdout.
	rootCmd.SetOut(os.Stdout)

	return rootCmd
}

func CreateCompletionCommand(rootCmd *cobra.Command) *cobra.Command {
	completionCmd := &cobra.Command{
		Use:   "completion",
		Short: "Generate shell completion scripts for robognome",
		Long: `Generate shell completion scripts for robognome.

The command for each shell will print a completion script to stdout. You can source this script to get
completions in your current shell session. You can add this script to the completion directory for your
shell to get completions for all future sessions.

For example, to activate bash completions in your current shell:
		$ . <(robognome completion bash)

To add robognome completions for all bash sessions:
		$ robognome completion bash > /etc/bash_completion.d/robognome_completions`,
	}

	bashCompletionCmd := &cobra.Command{
		Use:   "bash",
		Short: "bash completions for robognome",
		Run: func(cmd *cobra.Command, args []string) {
			rootCmd.GenBashCompletion(cmd.OutOrStdout())
		},
	}

	zshCompletionCmd := &cobra.Command{
		Use:   "zsh",
		Short: "zsh completions for robognome",
		Run: func(cmd *cobra.Command, args []string) {
			rootCmd.GenZshCompletion(cmd.OutOrStdout())
		},
	}

	fishCompletionCmd := &cobra.Command{
		Use:   "fish",
		Short: "fish completions for robognome",
		Run: func(cmd *cobra.Command, args []string) {
			rootCmd.GenFishCompletion(cmd.OutOrStdout(), true)
		},
	}

	powershellCompletionCmd := &cobra.Command{
		Use:   "powershell",
		Short: "powershell completions for robognome",
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
		Short: "Print the version of robognome that you are currently using",
		Run: func(cmd *cobra.Command, args []string) {
			cmd.Println(version.RoboGnomeVersion)
		},
	}

	return versionCmd
}

func CreateRunCommand() *cobra.Command {
	var metronomeAddressRaw, rpc, keyfile, password, scheduleIDRaw string
	var intervalMilliseconds uint64
	var resilient bool

	var metronomeAddress common.Address
	var scheduleID *big.Int

	runCmd := &cobra.Command{
		Use:   "run",
		Short: "Run the robognome",
		PreRunE: func(cmd *cobra.Command, args []string) error {
			if metronomeAddressRaw == "" {
				return fmt.Errorf("--contract not specified")
			} else if !common.IsHexAddress(metronomeAddressRaw) {
				return fmt.Errorf("--contract is not a valid Ethereum address")
			}
			metronomeAddress = common.HexToAddress(metronomeAddressRaw)

			if keyfile == "" {
				return fmt.Errorf("--keystore not specified (this should be a path to an Ethereum account keystore file)")
			}

			if rpc == "" {
				return fmt.Errorf("--rpc not specified (this should be a URL to an Ethereum JSONRPC API)")
			}

			if scheduleIDRaw == "" {
				return fmt.Errorf("--schedule argument not specified")
			}
			scheduleID = new(big.Int)
			scheduleID.SetString(scheduleIDRaw, 0)

			return nil
		},
		RunE: func(cmd *cobra.Command, args []string) error {
			client, clientErr := Metronome.NewClient(rpc)
			if clientErr != nil {
				return clientErr
			}

			key, keyErr := Metronome.KeyFromFile(keyfile, password)
			if keyErr != nil {
				return keyErr
			}

			return Run(metronomeAddress, key, client, intervalMilliseconds, scheduleID, resilient)
		},
	}

	runCmd.Flags().StringVarP(&rpc, "rpc", "r", "", "RPC URL for the blockchain node")
	runCmd.Flags().StringVarP(&metronomeAddressRaw, "contract", "c", "", "Metronome contract address")
	runCmd.Flags().StringVarP(&keyfile, "keyfile", "k", "", "Path to the keyfile for the claimant account")
	runCmd.Flags().StringVarP(&password, "password", "p", "", "Password for the claimant account (if not provided, you will be prompted for this)")
	runCmd.Flags().StringVarP(&scheduleIDRaw, "schedule", "s", "", "Schedule ID of the schedule to monitor")
	runCmd.Flags().Uint64VarP(&intervalMilliseconds, "interval", "i", 100, "Interval in milliseconds between bounty checks")
	runCmd.Flags().BoolVar(&resilient, "resilient", false, "If set, the bot will continue running even if it encounters an error")

	return runCmd
}
