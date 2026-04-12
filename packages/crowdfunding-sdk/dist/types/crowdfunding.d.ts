/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/crowdfunding.json`.
 */
export type Crowdfunding = {
    "address": "CYHkx1NUFKahYj4esTR6iuk5MnTZgCKsxufbD2cdK94k";
    "metadata": {
        "name": "crowdfunding";
        "version": "0.1.0";
        "spec": "0.1.0";
        "description": "Created with Anchor";
    };
    "instructions": [
        {
            "name": "contribute";
            "docs": [
                "Contributes lamports to an active campaign.",
                "",
                "# Arguments",
                "* `ctx` - The context containing the `Campaign`, the `Contribution` PDA tracking the donor's balance, and the vault.",
                "* `amount` - The number of lamports to contribute."
            ];
            "discriminator": [
                82,
                33,
                68,
                131,
                32,
                0,
                205,
                95
            ];
            "accounts": [
                {
                    "name": "campaign";
                    "writable": true;
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const";
                                "value": [
                                    99,
                                    97,
                                    109,
                                    112,
                                    97,
                                    105,
                                    103,
                                    110
                                ];
                            },
                            {
                                "kind": "account";
                                "path": "campaign.creator";
                                "account": "campaign";
                            },
                            {
                                "kind": "account";
                                "path": "campaign.campaign_id";
                                "account": "campaign";
                            }
                        ];
                    };
                },
                {
                    "name": "contribution";
                    "writable": true;
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const";
                                "value": [
                                    99,
                                    111,
                                    110,
                                    116,
                                    114,
                                    105,
                                    98,
                                    117,
                                    116,
                                    105,
                                    111,
                                    110
                                ];
                            },
                            {
                                "kind": "account";
                                "path": "campaign";
                            },
                            {
                                "kind": "account";
                                "path": "donor";
                            }
                        ];
                    };
                },
                {
                    "name": "vault";
                    "writable": true;
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const";
                                "value": [
                                    118,
                                    97,
                                    117,
                                    108,
                                    116
                                ];
                            },
                            {
                                "kind": "account";
                                "path": "campaign";
                            }
                        ];
                    };
                },
                {
                    "name": "donor";
                    "writable": true;
                    "signer": true;
                },
                {
                    "name": "systemProgram";
                    "address": "11111111111111111111111111111111";
                }
            ];
            "args": [
                {
                    "name": "amount";
                    "type": "u64";
                }
            ];
        },
        {
            "name": "createCampaign";
            "docs": [
                "Creates a new crowdfunding campaign associated with the creator's profile.",
                "",
                "# Arguments",
                "* `ctx` - The context containing the `CreatorProfile`, the new `Campaign` PDA, and the vault.",
                "* `goal` - The funding goal in lamports.",
                "* `deadline` - The Unix timestamp marking the end of the campaign."
            ];
            "discriminator": [
                111,
                131,
                187,
                98,
                160,
                193,
                114,
                244
            ];
            "accounts": [
                {
                    "name": "profile";
                    "writable": true;
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const";
                                "value": [
                                    112,
                                    114,
                                    111,
                                    102,
                                    105,
                                    108,
                                    101
                                ];
                            },
                            {
                                "kind": "account";
                                "path": "creator";
                            }
                        ];
                    };
                },
                {
                    "name": "campaign";
                    "writable": true;
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const";
                                "value": [
                                    99,
                                    97,
                                    109,
                                    112,
                                    97,
                                    105,
                                    103,
                                    110
                                ];
                            },
                            {
                                "kind": "account";
                                "path": "creator";
                            },
                            {
                                "kind": "account";
                                "path": "profile.campaign_count";
                                "account": "creatorProfile";
                            }
                        ];
                    };
                },
                {
                    "name": "vault";
                    "writable": true;
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const";
                                "value": [
                                    118,
                                    97,
                                    117,
                                    108,
                                    116
                                ];
                            },
                            {
                                "kind": "account";
                                "path": "campaign";
                            }
                        ];
                    };
                },
                {
                    "name": "creator";
                    "writable": true;
                    "signer": true;
                    "relations": [
                        "profile"
                    ];
                },
                {
                    "name": "systemProgram";
                    "address": "11111111111111111111111111111111";
                }
            ];
            "args": [
                {
                    "name": "goal";
                    "type": "u64";
                },
                {
                    "name": "deadline";
                    "type": "i64";
                }
            ];
        },
        {
            "name": "createProfile";
            "docs": [
                "Creates a new creator profile to launch campaigns.",
                "",
                "# Arguments",
                "* `ctx` - The context of the instruction containing the `CreatorProfile` PDA and creator signer.",
                "* `metadata_uri` - A string representing the URI (e.g., IPFS) for the creator's metadata."
            ];
            "discriminator": [
                225,
                205,
                234,
                143,
                17,
                186,
                50,
                220
            ];
            "accounts": [
                {
                    "name": "profile";
                    "writable": true;
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const";
                                "value": [
                                    112,
                                    114,
                                    111,
                                    102,
                                    105,
                                    108,
                                    101
                                ];
                            },
                            {
                                "kind": "account";
                                "path": "creator";
                            }
                        ];
                    };
                },
                {
                    "name": "creator";
                    "writable": true;
                    "signer": true;
                },
                {
                    "name": "systemProgram";
                    "address": "11111111111111111111111111111111";
                }
            ];
            "args": [
                {
                    "name": "metadataUri";
                    "type": "string";
                }
            ];
        },
        {
            "name": "initializeContribution";
            "docs": [
                "Initializes a contribution account for a donor to track their total contributions to a campaign.",
                "",
                "# Arguments",
                "* `ctx` - The context containing the `Campaign`, the new `Contribution` PDA, and the donor signer."
            ];
            "discriminator": [
                40,
                211,
                100,
                168,
                2,
                107,
                66,
                99
            ];
            "accounts": [
                {
                    "name": "campaign";
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const";
                                "value": [
                                    99,
                                    97,
                                    109,
                                    112,
                                    97,
                                    105,
                                    103,
                                    110
                                ];
                            },
                            {
                                "kind": "account";
                                "path": "campaign.creator";
                                "account": "campaign";
                            },
                            {
                                "kind": "account";
                                "path": "campaign.campaign_id";
                                "account": "campaign";
                            }
                        ];
                    };
                },
                {
                    "name": "contribution";
                    "writable": true;
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const";
                                "value": [
                                    99,
                                    111,
                                    110,
                                    116,
                                    114,
                                    105,
                                    98,
                                    117,
                                    116,
                                    105,
                                    111,
                                    110
                                ];
                            },
                            {
                                "kind": "account";
                                "path": "campaign";
                            },
                            {
                                "kind": "account";
                                "path": "donor";
                            }
                        ];
                    };
                },
                {
                    "name": "donor";
                    "writable": true;
                    "signer": true;
                },
                {
                    "name": "systemProgram";
                    "address": "11111111111111111111111111111111";
                }
            ];
            "args": [];
        },
        {
            "name": "refund";
            "docs": [
                "Refunds a donor's contribution from a failed campaign.",
                "",
                "Can only be called by the donor after the deadline passes and if the raised amount did not meet the goal.",
                "",
                "# Arguments",
                "* `ctx` - The context containing the `Campaign`, the `Vault`, and the donor's `Contribution` account."
            ];
            "discriminator": [
                2,
                96,
                183,
                251,
                63,
                208,
                46,
                46
            ];
            "accounts": [
                {
                    "name": "campaign";
                    "writable": true;
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const";
                                "value": [
                                    99,
                                    97,
                                    109,
                                    112,
                                    97,
                                    105,
                                    103,
                                    110
                                ];
                            },
                            {
                                "kind": "account";
                                "path": "campaign.creator";
                                "account": "campaign";
                            },
                            {
                                "kind": "account";
                                "path": "campaign.campaign_id";
                                "account": "campaign";
                            }
                        ];
                    };
                },
                {
                    "name": "vault";
                    "writable": true;
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const";
                                "value": [
                                    118,
                                    97,
                                    117,
                                    108,
                                    116
                                ];
                            },
                            {
                                "kind": "account";
                                "path": "campaign";
                            }
                        ];
                    };
                },
                {
                    "name": "contribution";
                    "writable": true;
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const";
                                "value": [
                                    99,
                                    111,
                                    110,
                                    116,
                                    114,
                                    105,
                                    98,
                                    117,
                                    116,
                                    105,
                                    111,
                                    110
                                ];
                            },
                            {
                                "kind": "account";
                                "path": "campaign";
                            },
                            {
                                "kind": "account";
                                "path": "donor";
                            }
                        ];
                    };
                },
                {
                    "name": "donor";
                    "writable": true;
                    "signer": true;
                },
                {
                    "name": "systemProgram";
                    "address": "11111111111111111111111111111111";
                }
            ];
            "args": [];
        },
        {
            "name": "updateProfile";
            "docs": [
                "Updates the metadata URI for an existing creator profile.",
                "",
                "# Arguments",
                "* `ctx` - The context containing the `CreatorProfile` PDA and the creator signer.",
                "* `metadata_uri` - The new metadata URI to store in the profile."
            ];
            "discriminator": [
                98,
                67,
                99,
                206,
                86,
                115,
                175,
                1
            ];
            "accounts": [
                {
                    "name": "profile";
                    "writable": true;
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const";
                                "value": [
                                    112,
                                    114,
                                    111,
                                    102,
                                    105,
                                    108,
                                    101
                                ];
                            },
                            {
                                "kind": "account";
                                "path": "creator";
                            }
                        ];
                    };
                },
                {
                    "name": "creator";
                    "writable": true;
                    "signer": true;
                    "relations": [
                        "profile"
                    ];
                }
            ];
            "args": [
                {
                    "name": "metadataUri";
                    "type": "string";
                }
            ];
        },
        {
            "name": "withdraw";
            "docs": [
                "Withdraws all raised funds from a successful campaign.",
                "",
                "Can only be called by the creator after the deadline passes and if the raised amount meets or exceeds the goal.",
                "",
                "# Arguments",
                "* `ctx` - The context containing the `Campaign`, the `Vault`, and the creator."
            ];
            "discriminator": [
                183,
                18,
                70,
                156,
                148,
                109,
                161,
                34
            ];
            "accounts": [
                {
                    "name": "campaign";
                    "writable": true;
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const";
                                "value": [
                                    99,
                                    97,
                                    109,
                                    112,
                                    97,
                                    105,
                                    103,
                                    110
                                ];
                            },
                            {
                                "kind": "account";
                                "path": "campaign.creator";
                                "account": "campaign";
                            },
                            {
                                "kind": "account";
                                "path": "campaign.campaign_id";
                                "account": "campaign";
                            }
                        ];
                    };
                },
                {
                    "name": "vault";
                    "writable": true;
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const";
                                "value": [
                                    118,
                                    97,
                                    117,
                                    108,
                                    116
                                ];
                            },
                            {
                                "kind": "account";
                                "path": "campaign";
                            }
                        ];
                    };
                },
                {
                    "name": "creator";
                    "writable": true;
                    "signer": true;
                    "relations": [
                        "campaign"
                    ];
                },
                {
                    "name": "systemProgram";
                    "address": "11111111111111111111111111111111";
                }
            ];
            "args": [];
        }
    ];
    "accounts": [
        {
            "name": "campaign";
            "discriminator": [
                50,
                40,
                49,
                11,
                157,
                220,
                229,
                192
            ];
        },
        {
            "name": "contribution";
            "discriminator": [
                182,
                187,
                14,
                111,
                72,
                167,
                242,
                212
            ];
        },
        {
            "name": "creatorProfile";
            "discriminator": [
                251,
                250,
                184,
                111,
                214,
                178,
                32,
                221
            ];
        }
    ];
    "events": [
        {
            "name": "campaignCreated";
            "discriminator": [
                9,
                98,
                69,
                61,
                53,
                131,
                64,
                152
            ];
        },
        {
            "name": "contributionInitialized";
            "discriminator": [
                155,
                68,
                84,
                116,
                148,
                227,
                228,
                191
            ];
        },
        {
            "name": "contributionMade";
            "discriminator": [
                81,
                218,
                72,
                109,
                93,
                96,
                131,
                199
            ];
        },
        {
            "name": "fundsWithdrawn";
            "discriminator": [
                56,
                130,
                230,
                154,
                35,
                92,
                11,
                118
            ];
        },
        {
            "name": "profileCreated";
            "discriminator": [
                134,
                233,
                199,
                153,
                77,
                206,
                128,
                94
            ];
        },
        {
            "name": "profileUpdated";
            "discriminator": [
                186,
                248,
                62,
                98,
                112,
                98,
                161,
                252
            ];
        },
        {
            "name": "refundIssued";
            "discriminator": [
                249,
                16,
                159,
                159,
                93,
                186,
                145,
                206
            ];
        }
    ];
    "errors": [
        {
            "code": 6000;
            "name": "invalidDeadline";
            "msg": "Deadline must be in the future";
        },
        {
            "code": 6001;
            "name": "deadlineNotReached";
            "msg": "Campaign deadline has not passed";
        },
        {
            "code": 6002;
            "name": "deadlinePassed";
            "msg": "Campaign deadline has passed";
        },
        {
            "code": 6003;
            "name": "goalNotReached";
            "msg": "Goal not reached";
        },
        {
            "code": 6004;
            "name": "goalAlreadyReached";
            "msg": "Goal already reached";
        },
        {
            "code": 6005;
            "name": "alreadyClaimed";
            "msg": "Already claimed";
        },
        {
            "code": 6006;
            "name": "unauthorized";
            "msg": "Not the campaign creator";
        },
        {
            "code": 6007;
            "name": "nothingToRefund";
            "msg": "Nothing to refund";
        },
        {
            "code": 6008;
            "name": "uriTooLong";
            "msg": "Metadata URI exceeds maximum length of 200 characters";
        },
        {
            "code": 6009;
            "name": "zeroAmount";
            "msg": "Must be greater than zero";
        },
        {
            "code": 6010;
            "name": "campaignCountOverflow";
            "msg": "Campaign count overflow";
        }
    ];
    "types": [
        {
            "name": "campaign";
            "docs": [
                "State account representing an active or completed crowdfunding campaign.",
                "Pda seeded by `[b\"campaign\", creator.key().as_ref(), &campaign_id.to_le_bytes()]`."
            ];
            "type": {
                "kind": "struct";
                "fields": [
                    {
                        "name": "creator";
                        "docs": [
                            "The public key of the creator who launched this campaign."
                        ];
                        "type": "pubkey";
                    },
                    {
                        "name": "campaignId";
                        "docs": [
                            "The sequential ID of the campaign, specific to this creator."
                        ];
                        "type": "u64";
                    },
                    {
                        "name": "goal";
                        "docs": [
                            "The target amount of lamports the campaign aims to raise."
                        ];
                        "type": "u64";
                    },
                    {
                        "name": "raised";
                        "docs": [
                            "The total amount of lamports raised so far."
                        ];
                        "type": "u64";
                    },
                    {
                        "name": "deadline";
                        "docs": [
                            "The Unix timestamp marking the end of the campaign, after which no contributions are accepted."
                        ];
                        "type": "i64";
                    },
                    {
                        "name": "claimed";
                        "docs": [
                            "Whether the funds have been successfully claimed by the creator."
                        ];
                        "type": "bool";
                    },
                    {
                        "name": "bump";
                        "docs": [
                            "Bump seed for PDA derivation."
                        ];
                        "type": "u8";
                    }
                ];
            };
        },
        {
            "name": "campaignCreated";
            "docs": [
                "Event emitted when a new crowdfunding campaign is launched."
            ];
            "type": {
                "kind": "struct";
                "fields": [
                    {
                        "name": "creator";
                        "docs": [
                            "The public key of the creator who launched the campaign."
                        ];
                        "type": "pubkey";
                    },
                    {
                        "name": "campaign";
                        "docs": [
                            "The public key of the newly created Campaign PDA."
                        ];
                        "type": "pubkey";
                    },
                    {
                        "name": "campaignId";
                        "docs": [
                            "The sequential ID assigned to this campaign."
                        ];
                        "type": "u64";
                    },
                    {
                        "name": "goal";
                        "docs": [
                            "The target funding goal in lamports."
                        ];
                        "type": "u64";
                    },
                    {
                        "name": "deadline";
                        "docs": [
                            "The Unix timestamp marking when the campaign ends."
                        ];
                        "type": "i64";
                    }
                ];
            };
        },
        {
            "name": "contribution";
            "docs": [
                "State account tracking a donor's total contributions to a specific campaign.",
                "Pda seeded by `[b\"contribution\", campaign.key().as_ref(), donor.key().as_ref()]`."
            ];
            "type": {
                "kind": "struct";
                "fields": [
                    {
                        "name": "donor";
                        "docs": [
                            "The public key of the donor who made the contribution."
                        ];
                        "type": "pubkey";
                    },
                    {
                        "name": "amount";
                        "docs": [
                            "The total amount of lamports contributed by the donor to this campaign."
                        ];
                        "type": "u64";
                    },
                    {
                        "name": "campaign";
                        "docs": [
                            "The public key of the campaign the contribution is directed towards."
                        ];
                        "type": "pubkey";
                    }
                ];
            };
        },
        {
            "name": "contributionInitialized";
            "docs": [
                "Event emitted when a donor initializes their contribution tracking account."
            ];
            "type": {
                "kind": "struct";
                "fields": [
                    {
                        "name": "campaign";
                        "docs": [
                            "The public key of the campaign being contributed to."
                        ];
                        "type": "pubkey";
                    },
                    {
                        "name": "donor";
                        "docs": [
                            "The public key of the donor."
                        ];
                        "type": "pubkey";
                    }
                ];
            };
        },
        {
            "name": "contributionMade";
            "docs": [
                "Event emitted when a donor successfully contributes lamports to an active campaign."
            ];
            "type": {
                "kind": "struct";
                "fields": [
                    {
                        "name": "campaign";
                        "docs": [
                            "The public key of the campaign that received the contribution."
                        ];
                        "type": "pubkey";
                    },
                    {
                        "name": "donor";
                        "docs": [
                            "The public key of the donor who made the contribution."
                        ];
                        "type": "pubkey";
                    },
                    {
                        "name": "amount";
                        "docs": [
                            "The amount of lamports contributed in this transaction."
                        ];
                        "type": "u64";
                    },
                    {
                        "name": "totalRaised";
                        "docs": [
                            "The new total amount of lamports raised by the campaign so far."
                        ];
                        "type": "u64";
                    }
                ];
            };
        },
        {
            "name": "creatorProfile";
            "docs": [
                "State account representing a creator's registered profile.",
                "Pda seeded by `[b\"profile\", creator.key().as_ref()]`."
            ];
            "type": {
                "kind": "struct";
                "fields": [
                    {
                        "name": "creator";
                        "docs": [
                            "The public key of the creator who registered this profile."
                        ];
                        "type": "pubkey";
                    },
                    {
                        "name": "campaignCount";
                        "docs": [
                            "The total number of campaigns launched by this creator, used as sequential IDs."
                        ];
                        "type": "u64";
                    },
                    {
                        "name": "metadataUri";
                        "docs": [
                            "A string URI (e.g., IPFS) linking to the creator's off-chain JSON metadata."
                        ];
                        "type": "string";
                    },
                    {
                        "name": "bump";
                        "docs": [
                            "Bump seed for PDA derivation."
                        ];
                        "type": "u8";
                    }
                ];
            };
        },
        {
            "name": "fundsWithdrawn";
            "docs": [
                "Event emitted when a creator successfully withdraws all raised funds from a completed campaign."
            ];
            "type": {
                "kind": "struct";
                "fields": [
                    {
                        "name": "campaign";
                        "docs": [
                            "The public key of the campaign funds were withdrawn from."
                        ];
                        "type": "pubkey";
                    },
                    {
                        "name": "creator";
                        "docs": [
                            "The public key of the creator who received the funds."
                        ];
                        "type": "pubkey";
                    },
                    {
                        "name": "amount";
                        "docs": [
                            "The total amount of lamports withdrawn."
                        ];
                        "type": "u64";
                    }
                ];
            };
        },
        {
            "name": "profileCreated";
            "docs": [
                "Event emitted when a new creator profile is successfully registered."
            ];
            "type": {
                "kind": "struct";
                "fields": [
                    {
                        "name": "creator";
                        "docs": [
                            "The public key of the creator who registered the profile."
                        ];
                        "type": "pubkey";
                    },
                    {
                        "name": "metadataUri";
                        "docs": [
                            "The URI linking to the creator's metadata."
                        ];
                        "type": "string";
                    }
                ];
            };
        },
        {
            "name": "profileUpdated";
            "docs": [
                "Event emitted when a creator updates their profile's metadata URI."
            ];
            "type": {
                "kind": "struct";
                "fields": [
                    {
                        "name": "creator";
                        "docs": [
                            "The public key of the creator who updated the profile."
                        ];
                        "type": "pubkey";
                    },
                    {
                        "name": "metadataUri";
                        "docs": [
                            "The new URI linking to the creator's updated metadata."
                        ];
                        "type": "string";
                    }
                ];
            };
        },
        {
            "name": "refundIssued";
            "docs": [
                "Event emitted when a donor reclaims their contribution from a failed campaign."
            ];
            "type": {
                "kind": "struct";
                "fields": [
                    {
                        "name": "campaign";
                        "docs": [
                            "The public key of the failed campaign."
                        ];
                        "type": "pubkey";
                    },
                    {
                        "name": "donor";
                        "docs": [
                            "The public key of the donor who received the refund."
                        ];
                        "type": "pubkey";
                    },
                    {
                        "name": "amount";
                        "docs": [
                            "The total amount of lamports refunded to the donor."
                        ];
                        "type": "u64";
                    }
                ];
            };
        }
    ];
};
