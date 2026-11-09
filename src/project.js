export const project = {
  "id": "skillstamp",
  "name": "SKILLSTAMP",
  "eyebrow": "VERIFIABLE SKILL ASSESSMENTS",
  "hero": "Proof of work. Credentials with context.",
  "intro": "Create a frozen challenge, submit hash-linked evidence, let independent GenLayer validators assess it, and issue a wallet-bound credential only after PASS.",
  "scope": "Synthetic, evidence-text challenge evaluations on Studionet. Does not execute source code, check external GitHub authorship, verify identity, or establish professional qualifications. A credential proves a scoped on-chain PASS decision and issuer-controlled status.",
  "labels": [
    "ChallengeBoard",
    "CredentialRegistry"
  ],
  "cards": [
    [
      "01",
      "Lock the challenge",
      "Issuer signs a concrete rubric and reference fixture."
    ],
    [
      "02",
      "Show your evidence",
      "Applicant signs text and a verified SHA-256 digest."
    ],
    [
      "03",
      "Evaluate",
      "GenLayer consensus returns PASS, FAIL or REVIEW."
    ],
    [
      "04",
      "Issue or revoke",
      "Only a matching PASS can create one wallet-bound credential."
    ]
  ],
  "forms": [
    {
      "method": "create_challenge",
      "scope": "first",
      "title": "Create a challenge",
      "role": "Issuer",
      "subtitle": "Freeze the evaluation rubric and a self-contained reference fixture.",
      "fields": [
        [
          "title",
          "Challenge title",
          "text"
        ],
        [
          "rubric",
          "Locked rubric",
          "textarea"
        ],
        [
          "reference_fixture",
          "Reference fixture",
          "textarea"
        ]
      ],
      "preset": "challenge"
    },
    {
      "method": "submit_evidence",
      "scope": "first",
      "title": "Submit applicant evidence",
      "role": "Applicant",
      "subtitle": "Issuer and applicant must use distinct wallets. The digest is calculated from the exact evidence string.",
      "fields": [
        [
          "challenge_id",
          "Challenge ID",
          "number"
        ],
        [
          "evidence",
          "Evidence text",
          "textarea"
        ],
        [
          "evidence_sha256",
          "SHA-256 of exact evidence",
          "hash"
        ]
      ],
      "hashSource": "evidence",
      "preset": "evidence"
    },
    {
      "method": "assess_attempt",
      "scope": "first",
      "title": "AI assessment",
      "role": "Issuer",
      "subtitle": "Validators independently compare the submitted text against the locked rubric.",
      "fields": [
        [
          "attempt_id",
          "Attempt ID",
          "number"
        ]
      ]
    },
    {
      "method": "issue_credential",
      "scope": "second",
      "title": "Issue scoped credential",
      "role": "Applicant",
      "subtitle": "Only the applicant from a PASS attempt may create one credential.",
      "fields": [
        [
          "attempt_id",
          "Attempt ID",
          "number"
        ]
      ]
    },
    {
      "method": "revoke_credential",
      "scope": "second",
      "title": "Revoke credential",
      "role": "Issuer",
      "subtitle": "A revoked credential remains queryable; its status becomes REVOKED.",
      "fields": [
        [
          "credential_id",
          "Credential ID",
          "number"
        ],
        [
          "reason",
          "Revocation reason",
          "textarea"
        ]
      ]
    },
    {
      "method": "close_challenge",
      "scope": "first",
      "title": "Close challenge",
      "role": "Issuer",
      "subtitle": "Stops new attempts and new issuance eligibility.",
      "fields": [
        [
          "challenge_id",
          "Challenge ID",
          "number"
        ]
      ]
    }
  ],
  "presets": {
    "challenge": {
      "title": "Event Indexing Reliability Challenge",
      "rubric": "To PASS, the applicant must give a complete JSON example with the exact indexed record IDs, a correct duplicate-handling rule, the expected record count after replay, and an explicit strategy for invalid events. The response must show that exactly two unique records are stored after deduplicating the fixture; duplicates must not create new records. FAIL if the submission explicitly reports three unique records or retains the duplicate as a separate entry. REVIEW if the count, duplicate handling, or invalid-event behavior is absent or ambiguous.",
      "reference_fixture": "{\"events\":[{\"id\":\"EVT-1\",\"value\":8},{\"id\":\"EVT-2\",\"value\":5},{\"id\":\"EVT-1\",\"value\":8}],\"expectedUniqueIds\":[\"EVT-1\",\"EVT-2\"],\"expectedCount\":2,\"invalidEvent\":{\"id\":\"\",\"value\":\"NaN\"}}"
    },
    "evidence": {
      "challenge_id": 1,
      "evidence": "{\"uniqueIds\":[\"EVT-1\",\"EVT-2\"],\"uniqueCount\":2,\"duplicateRule\":\"Use immutable event ID as idempotency key; duplicate EVT-1 does not create another stored record.\",\"invalidEvent\":\"Reject missing ID and invalid amount; record an audit error and do not index.\"}"
    }
  },
  "reads": [
    [
      "Challenge",
      "first",
      "get_challenge",
      [
        "id"
      ]
    ],
    [
      "Attempt",
      "first",
      "get_attempt",
      [
        "id"
      ]
    ],
    [
      "Applicant attempt",
      "first",
      "attempt_for",
      [
        "id",
        "address"
      ]
    ],
    [
      "Credential permission",
      "first",
      "credential_permission",
      [
        "id",
        "address"
      ]
    ],
    [
      "Credential",
      "second",
      "get_credential",
      [
        "id"
      ]
    ],
    [
      "Holder credential",
      "second",
      "credential_for",
      [
        "id",
        "address"
      ]
    ],
    [
      "Challenge totals",
      "first",
      "stats",
      []
    ],
    [
      "Credential totals",
      "second",
      "stats",
      []
    ]
  ]
};
