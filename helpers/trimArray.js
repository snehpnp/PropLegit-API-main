module.exports = (array) => {
  return array.map((s) =>
    typeof s === 'string' ? s.replace(/\s+/g, ' ').trim() : s,
  );
};
