# Solana Crowdfunding

A crowdfunding smart contract on Solana built with Anchor. Creators launch campaigns with a funding goal and deadline. Donations are locked in a PDA vault — not sent directly to the creator. After the deadline, the creator withdraws if the goal was met, or donors claim refunds if it wasn't.

## How It Works

```mermaid
sequenceDiagram
    actor Creator
    actor Donor
    participant Program
    participant Vault (PDA)

    Creator->>Program: create_campaign(goal, deadline)
    Program-->>Creator: Campaign PDA initialized

    Donor->>Program: contribute(amount)
    Program->>Vault (PDA): Lock SOL
    Program-->>Donor: Contribution recorded

    alt Goal met after deadline
        Creator->>Program: withdraw()
        Program->>Vault (PDA): Drain all SOL
        Vault (PDA)-->>Creator: SOL transferred
    else Goal not met after deadline
        Donor->>Program: refund()
        Program->>Vault (PDA): Drain donor's contribution
        Vault (PDA)-->>Donor: SOL returned
    end
```

## Campaign Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Active: create_campaign()

    Active --> Active: contribute() [before deadline, goal not met]
    Active --> GoalMet: contribute() [goal reached]
    Active --> Failed: deadline passes [goal not met]
    GoalMet --> Failed: deadline passes [should not happen - goal met]
    GoalMet --> Claimed: withdraw() [creator claims]
    Failed --> Refunded: refund() [each donor claims back]
    Claimed --> [*]
    Refunded --> [*]
```

## Account Structure

```mermaid
erDiagram
    Campaign {
        Pubkey creator
        u64 goal
        u64 raised
        i64 deadline
        bool claimed
        u8 bump
    }
    Contribution {
        Pubkey donor
        Pubkey campaign
        u64 amount
    }
    Vault {
        lamports balance
    }
    Campaign ||--o{ Contribution : "has many"
    Campaign ||--|| Vault : "owns"
```

## Instructions

| Instruction       | Caller       | Conditions                            | Effect                                                    |
| ----------------- | ------------ | ------------------------------------- | --------------------------------------------------------- |
| `create_campaign` | Creator      | Deadline in the future                | Initializes Campaign PDA                                  |
| `contribute`      | Anyone       | Before deadline, goal not yet met     | Locks SOL in vault, updates raised                        |
| `withdraw`        | Creator only | After deadline, goal met, not claimed | Drains vault to creator                                   |
| `refund`          | Donor        | After deadline, goal not met          | Returns donor's contribution, closes Contribution account |

## Contribution Rules

- Contributions are **capped** at the remaining goal — overshoot is trimmed, not rejected
- A donor can contribute **multiple times**; amounts accumulate in their Contribution PDA
- Once the goal is met or the deadline passes, contributions are blocked

## PDA Seeds

| Account        | Seeds                                             |
| -------------- | ------------------------------------------------- |
| `Campaign`     | `["campaign", creator_pubkey]`                    |
| `Vault`        | `["vault", campaign_pubkey]`                      |
| `Contribution` | `["contribution", campaign_pubkey, donor_pubkey]` |

## Error Reference

| Error                | Cause                                     |
| -------------------- | ----------------------------------------- |
| `InvalidDeadline`    | Deadline is not in the future             |
| `DeadlineNotReached` | Withdraw/refund attempted before deadline |
| `DeadlinePassed`     | Contribution attempted after deadline     |
| `GoalNotReached`     | Withdraw attempted but goal not met       |
| `GoalAlreadyReached` | Contribution attempted but goal fully met |
| `AlreadyClaimed`     | Withdraw attempted after already claimed  |
| `Unauthorized`       | Non-creator attempted to withdraw         |
| `NothingToRefund`    | Donor has no contribution to refund       |

## Project Structure

```txt
programs/crowdfunding/src/
├── lib.rs                    # Program entry point and instruction dispatchers
├── errors.rs                 # Custom error codes
├── state/
│   ├── campaign.rs           # Campaign account struct
│   └── contribution.rs       # Contribution account struct
└── instructions/
    ├── create_campaign.rs    # Initialize a new campaign
    ├── contribute.rs         # Donate SOL to a campaign
    ├── withdraw.rs           # Creator claims funds after success
    └── refund.rs             # Donor reclaims contribution after failure
```

## Prerequisites

- [Rust](https://rustup.rs/)
- [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools)
- [Anchor CLI](https://www.anchor-lang.com/docs/installation)
- [Node.js](https://nodejs.org/) + [pnpm](https://pnpm.io/)

## Setup

```bash
# Install dependencies
pnpm install

# Build the program
anchor build

# Get your program ID
anchor keys list
```

Update `declare_id!("...")` in `programs/crowdfunding/src/lib.rs` and `[programs.localnet]` in `Anchor.toml` with the output from `anchor keys list`.

## Running Tests

```bash
# Terminal 1 — start local validator
solana-test-validator --reset

# Terminal 2 — run tests
anchor test --skip-local-validator
```

## Deployment

```bash
# Switch to devnet
solana config set --url devnet

# Fund your wallet
solana airdrop 2

# Deploy
anchor deploy --provider.cluster devnet
```

## Deployment Info

|                |                                                                                          |
| -------------- | ---------------------------------------------------------------------------------------- |
| **Network**    | Solana Devnet                                                                            |
| **Program ID** | `3qUXqi2J3W9juVRqZNrwjpH9WPfzx8wHaPAboXVJVPpp`                                           |
| **Solscan**    | <https://solscan.io/account/3qUXqi2J3W9juVRqZNrwjpH9WPfzx8wHaPAboXVJVPpp?cluster=devnet> |
