export const ID_VALIDATION_ERROR = "wrong id format";
export const GOOD_NOT_EXIST_ERROR = "goodId not exist in WB";
export const DATE_FORMAT = "YYYY-MM-DD";
export const COLOR_VALIDATION_ERROR = "not valid color";
export const WITHDRAW_AMOUNT_EXCEED_PROJECT_BALANCE_ERROR =
  "Amount of withdrawal exceeds project balance";

export const reduceCallbackForMap =
  <T>(key: keyof T) =>
  (previousValue: Map<T[keyof T], T>, currElement: T): Map<T[keyof T], T> => {
    return previousValue.set(currElement[key], currElement);
  };

export enum Sort {
  ASC = 1,
  DESC = -1,
}
