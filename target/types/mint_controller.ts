export type MintController = {
  version: "0.1.0"
  name: "mint_controller"
  instructions: [
    {
      name: "initialize"
      accounts: [
        {
          name: "config"
          isMut: true
          isSigner: false
        },
        {
          name: "mint"
          isMut: true
          isSigner: false
        },
        {
          name: "mintAuthority"
          isMut: false
          isSigner: false
        },
        {
          name: "payer"
          isMut: true
          isSigner: true
        },
        {
          name: "systemProgram"
          isMut: false
          isSigner: false
        },
      ]
      args: [
        {
          name: "admin"
          type: "publicKey"
        },
        {
          name: "quorum"
          type: "u8"
        },
        {
          name: "oracleSigners"
          type: {
            vec: "publicKey"
          }
        },
      ]
    },
  ]
  accounts: [
    {
      name: "config"
      type: {
        kind: "struct"
        fields: [
          {
            name: "admin"
            type: "publicKey"
          },
          {
            name: "mint"
            type: "publicKey"
          },
          {
            name: "quorum"
            type: "u8"
          },
          {
            name: "totalMinted"
            type: "u64"
          },
          {
            name: "oracleSigners"
            type: {
              vec: "publicKey"
            }
          },
          {
            name: "nonce"
            type: "u64"
          },
          {
            name: "bump"
            type: "u8"
          },
        ]
      }
    },
  ]
  events: [
    {
      name: "MintEvent"
      fields: [
        {
          name: "recipient"
          type: "publicKey"
          index: false
        },
        {
          name: "amount"
          type: "u64"
          index: false
        },
        {
          name: "reason"
          type: "string"
          index: false
        },
        {
          name: "nonce"
          type: "u64"
          index: false
        },
        {
          name: "signers"
          type: {
            vec: "publicKey"
          }
          index: false
        },
      ]
    },
  ]
  errors: [
    {
      code: 6000
      name: "QuorumNotReached"
      msg: "Quorum not reached"
    },
    {
      code: 6001
      name: "InvalidSignature"
      msg: "Invalid signature"
    },
    {
      code: 6002
      name: "Unauthorized"
      msg: "Unauthorized"
    },
    {
      code: 6003
      name: "InvalidQuorum"
      msg: "Invalid quorum setting"
    },
    {
      code: 6004
      name: "TooManySigners"
      msg: "Too many signers (max 10)"
    },
    {
      code: 6005
      name: "ExceedsMaxSupply"
      msg: "Exceeds maximum supply"
    },
    {
      code: 6006
      name: "InvalidNonce"
      msg: "Invalid nonce (must be greater than current)"
    },
    {
      code: 6007
      name: "Overflow"
      msg: "Arithmetic overflow"
    },
    {
      code: 6008
      name: "InitialMintAlreadyDone"
      msg: "Initial mint already completed"
    },
  ]
}
