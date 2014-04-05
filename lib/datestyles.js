var seperators = ['.', '-', '/'];

var endians = {
  L: [
  'DD-MM',
  'DD-MM-YY',
  'DD-MM-YYYY'
  ],

  M: [
  'MM-DD',
  'MM-DD-YY',
  'MM-DD-YYYY'
  ],

  B: [
  'YY-MM-DD',
  'YYYY-MM-DD'
  ]
};

Object.keys(endians).forEach(function (en) {
  endians[en] = endians[en].reduce(function (arr, sequence) {
    seperators.forEach(function (sep) {
      arr.push(sequence.replace(RegExp('-', 'g'), sep));
    });
    return arr;
  }, []);
});



module.exports = endians;
