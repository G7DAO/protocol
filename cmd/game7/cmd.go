package main

import (
	"os"

	"github.com/spf13/cobra"

	"github.com/G7DAO/protocol/bindings/ArbSys"
	"github.com/G7DAO/protocol/bindings/ArbitrumL1OrbitCustomGateway"
	"github.com/G7DAO/protocol/bindings/ArbitrumL1OrbitGatewayRouter"
	"github.com/G7DAO/protocol/bindings/ArbitrumL2CustomGateway"
	"github.com/G7DAO/protocol/bindings/ArbitrumUpgradeExecutor"
	"github.com/G7DAO/protocol/bindings/ERC20Inbox"

	"github.com/G7DAO/protocol/bindings/Game7Token"
	"github.com/G7DAO/protocol/bindings/Staking"
	"github.com/G7DAO/protocol/bindings/Staking2"
	"github.com/G7DAO/protocol/bindings/StakingTokens"
	"github.com/G7DAO/protocol/cmd/game7/version"
)

func CreateRootCommand() *cobra.Command {
	// rootCmd represents the base command when called without any subcommands
	rootCmd := &cobra.Command{
		Use:   "game7",
		Short: "game7: CLI to the Game7 protocol",
		Run: func(cmd *cobra.Command, args []string) {
			cmd.Help()
		},
	}

	completionCmd := CreateCompletionCommand(rootCmd)
	versionCmd := CreateVersionCommand()

	tokenCmd := Game7Token.CreateGame7TokenCommand()
	tokenCmd.Use = "token"

	stakingCmd := Staking.CreateStakingCommand()
	stakingCmd.Use = "staking"

	staking2Cmd := Staking2.CreateStaking2Command()
	staking2Cmd.Use = "staking2"

	stakingTokensCmd := StakingTokens.CreateStakingTokensCommand()
	stakingTokensCmd.Use = "staking-tokens"

	arbitrumL1OrbitCustomGatewayCmd := ArbitrumL1OrbitCustomGateway.CreateL1OrbitCustomGatewayCommand()
	arbitrumL1OrbitCustomGatewayCmd.Use = "arbitrum-l1-orbit-custom-gateway"

	arbitrumL2CustomGatewayCmd := ArbitrumL2CustomGateway.CreateL2CustomGatewayCommand()
	arbitrumL2CustomGatewayCmd.Use = "arbitrum-l2-custom-gateway"

	arbitrumUpgradeExecutorCmd := ArbitrumUpgradeExecutor.CreateArbitrumUpgradeExecutorCommand()
	arbitrumUpgradeExecutorCmd.Use = "arbitrum-upgrade-executor"

	arbitrumL1OrbitGatewayRouterCmd := ArbitrumL1OrbitGatewayRouter.CreateL1OrbitGatewayRouterCommand()
	arbitrumL1OrbitGatewayRouterCmd.Use = "arbitrum-l1-orbit-gateway-router"

	arbSysCmd := ArbSys.CreateArbSysCommand()
	arbSysCmd.Use = "arb-sys"

	erc20InboxCmd := ERC20Inbox.CreateERC20InboxCommand()
	erc20InboxCmd.Use = "erc20-inbox"

	rootCmd.AddCommand(completionCmd, versionCmd, stakingCmd, staking2Cmd, stakingTokensCmd, arbitrumL1OrbitCustomGatewayCmd, arbitrumL2CustomGatewayCmd, arbitrumUpgradeExecutorCmd, arbitrumL1OrbitGatewayRouterCmd, arbSysCmd, erc20InboxCmd)

	// By default, cobra Command objects write to stderr. We have to forcibly set them to output to
	// stdout.
	rootCmd.SetOut(os.Stdout)

	return rootCmd
}

func CreateCompletionCommand(rootCmd *cobra.Command) *cobra.Command {
	completionCmd := &cobra.Command{
		Use:   "completion",
		Short: "Generate shell completion scripts for game7",
		Long: `Generate shell completion scripts for game7.

The command for each shell will print a completion script to stdout. You can source this script to get
completions in your current shell session. You can add this script to the completion directory for your
shell to get completions for all future sessions.

For example, to activate bash completions in your current shell:
		$ . <(game7 completion bash)

To add game7 completions for all bash sessions:
		$ game7 completion bash > /etc/bash_completion.d/game7_completions`,
	}

	bashCompletionCmd := &cobra.Command{
		Use:   "bash",
		Short: "bash completions for game7",
		Run: func(cmd *cobra.Command, args []string) {
			rootCmd.GenBashCompletion(cmd.OutOrStdout())
		},
	}

	zshCompletionCmd := &cobra.Command{
		Use:   "zsh",
		Short: "zsh completions for game7",
		Run: func(cmd *cobra.Command, args []string) {
			rootCmd.GenZshCompletion(cmd.OutOrStdout())
		},
	}

	fishCompletionCmd := &cobra.Command{
		Use:   "fish",
		Short: "fish completions for game7",
		Run: func(cmd *cobra.Command, args []string) {
			rootCmd.GenFishCompletion(cmd.OutOrStdout(), true)
		},
	}

	powershellCompletionCmd := &cobra.Command{
		Use:   "powershell",
		Short: "powershell completions for game7",
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
		Short: "Print the version of game7 that you are currently using",
		Run: func(cmd *cobra.Command, args []string) {
			cmd.Println(version.Game7Version)
		},
	}

	return versionCmd
}
