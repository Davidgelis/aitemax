
// tiny helper used by two different hooks
export const cleanTemplate = (tpl: any | null) => {
  if (!tpl) return null;
  const clone = { ...tpl };
  delete clone.draftId;
  delete clone.status;
  delete clone.isDefault;
  delete clone.created_at;
  delete clone.updated_at;
  delete clone.__typename;
  return clone;
};
