exports.up = (pgm) => {
  pgm.createSchema("paradox");
};
exports.down = (pgm) => {
  pgm.dropSchema("paradox");
};
