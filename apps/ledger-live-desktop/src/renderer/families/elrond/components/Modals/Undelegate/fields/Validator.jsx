// @flow

import React, { useMemo, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";

import FirstLetterIcon from "~/renderer/components/FirstLetterIcon";
import Box from "~/renderer/components/Box";
import Label from "~/renderer/components/Label";
import Select from "~/renderer/components/Select";
import Text from "~/renderer/components/Text";

import { denominate } from "~/renderer/families/elrond/helpers";
import { constants } from "~/renderer/families/elrond/constants";

const Item = item => {
  const label = item.data.validator.identity.name || item.data.validator.contract;
  const amount = useMemo(() => denominate({ input: item.data.userActiveStake, decimals: 6 }), [
    item.data.userActiveStake,
  ]);

  return (
    <Box
      key={item.data.contract}
      horizontal={true}
      alignItems="center"
      justifyContent="space-between"
    >
      <Box horizontal={true} alignItems="center">
        <FirstLetterIcon label={label} mr={2} />
        <Text ff="Inter|Medium">{label}</Text>
      </Box>

      <Text ff="Inter|Regular">
        {amount} {constants.egldLabel}
      </Text>
    </Box>
  );
};

const Dropdown = (props: Props) => {
  const { delegations, onChange, contract } = props;
  const { t } = useTranslation();

  const options = useMemo(
    () =>
      delegations.reduce(
        (total, delegation) =>
          delegation.contract === contract ? [delegation, ...total] : [...total, delegation],
        [],
      ),
    [delegations, contract],
  );

  const [query, setQuery] = useState("");
  const [value, setValue] = useState(options[0]);

  const noOptionsMessageCallback = useCallback(
    needle =>
      t("common.selectValidatorNoOption", {
        accountName: needle.inputValue,
      }),
    [t],
  );

  const filterOptions = useCallback(
    (option, needle) =>
      option.data.validator.identity.name
        ? option.data.validator.identity.name.toLowerCase().includes(needle.toLowerCase())
        : false,
    [],
  );

  const onValueChange = useCallback(
    option => {
      setValue(option);

      if (onChange) {
        onChange(option);
      }
    },
    [onChange],
  );

  return (
    <Box mb={4}>
      <Label>{t("elrond.undelegation.flow.steps.amount.fields.validator")}</Label>
      <Select
        value={value}
        options={options}
        renderValue={Item}
        renderOption={Item}
        onInputChange={setQuery}
        inputValue={query}
        filterOption={filterOptions}
        placeholder={t("common.selectAccount")}
        noOptionsMessage={noOptionsMessageCallback}
        onChange={onValueChange}
      />
    </Box>
  );
};

export default Dropdown;
