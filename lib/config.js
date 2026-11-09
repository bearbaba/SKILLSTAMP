export const ADDRESS_ENV={first:"CHALLENGE_BOARD_ADDRESS",second:"CREDENTIAL_REGISTRY_ADDRESS"};
export const METHODS={
  "first": {
    "get_challenge": [
      "id"
    ],
    "get_attempt": [
      "id"
    ],
    "attempt_for": [
      "id",
      "address"
    ],
    "credential_permission": [
      "id",
      "address"
    ],
    "stats": []
  },
  "second": {
    "get_credential": [
      "id"
    ],
    "credential_for": [
      "id",
      "address"
    ],
    "stats": []
  }
};
export function readConfig(env){return {first:env[ADDRESS_ENV.first]||'',second:env[ADDRESS_ENV.second]||''}}
