# TODO

## Phones

### Product Specific Configurations
- [ ] Implement product specific configuration section

### Activation Codes
- [ ] Add activation code functionality
  - [ ] Add `allowMraMode` field
  - [ ] Add `enableActivationID` field
  - [ ] Implement `listPhoneActivationCode` API call
    ```php
    $axlApi->listPhoneActivationCode([
      "searchCriteria" => ["phoneName" => "%"],
      "returnedTags" => [
        "phoneName" => "",
        "activationCode" => "",
        "activationCodeExpiry" => "",
        "enableActivationId" => "",
        "userId" => ""
      ]
    ]);
    ```
- [ ] Secure Shell Fields
