import { encodeAccountId } from "../../account";
import type { GetAccountShape } from "../../bridge/jsHelpers";
import { makeSync, makeScanAccounts, mergeOps } from "../../bridge/jsHelpers";
import {
  getAccount,
  getAccountDelegations,
  getOperations,
  hasESDTTokens,
} from "./api";
import elrondBuildESDTTokenAccounts from "./js-buildSubAccounts";
import { reconciliateSubAccounts } from "./js-reconciliation";
import { FEES_BALANCE } from "./constants";
import { TokenAccount } from "@ledgerhq/types-live";
import { computeDelegationBalance } from "./logic";
import { getProviders } from "./api/sdk";
import BigNumber from "bignumber.js";

const getAccountShape: GetAccountShape = async (info) => {
  const { address, initialAccount, currency, derivationMode } = info;
  const accountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: address,
    derivationMode,
  });
  const oldOperations = initialAccount?.operations || [];
  // Needed for incremental synchronisation
  const startAt = oldOperations.length
    ? Math.floor(oldOperations[0].date.valueOf() / 1000)
    : 0;

  const { blockHeight, balance, nonce } = await getAccount(address);

  const delegations = await getAccountDelegations(address);

  // Merge new operations with the previously synced ones
  const newOperations = await getOperations(accountId, address, startAt);
  const operations = mergeOps(oldOperations, newOperations);

  let subAccounts: TokenAccount[] | undefined = [];
  const hasTokens = await hasESDTTokens(address);
  if (hasTokens) {
    const tokenAccounts = await elrondBuildESDTTokenAccounts({
      currency,
      accountId: accountId,
      accountAddress: address,
      existingAccount: initialAccount,
      syncConfig: {
        paginationConfig: {},
      },
    });

    if (tokenAccounts) {
      subAccounts = reconciliateSubAccounts(tokenAccounts, initialAccount);
    }
  }

  // FIXME Is this required? We have the info from preload
  const providers = await getProviders();

  const delegationBalance = computeDelegationBalance(delegations);

  const shape = {
    id: accountId,
    balance: balance.plus(delegationBalance),
    spendableBalance: balance.gt(FEES_BALANCE)
      ? balance.minus(FEES_BALANCE)
      : new BigNumber(0),
    operationsCount: operations.length,
    blockHeight,
    elrondResources: {
      nonce,
      delegations,
      providers,
    },
    subAccounts,
    operations,
  };

  return shape;
};

export const scanAccounts = makeScanAccounts({ getAccountShape });
export const sync = makeSync({ getAccountShape });
