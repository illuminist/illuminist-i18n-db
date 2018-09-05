
export const lpad = function(value, padding) {
  var i, zeroes, _i;
  zeroes = "0";
  for (i = _i = 1; 1 <= padding ? _i <= padding : _i >= padding; i = 1 <= padding ? ++_i : --_i) {
    zeroes += "0";
  }
  return (zeroes + value).slice(padding * -1);
};

export const once = function(cb) {
  return function() {
    if (cb.once == null) {
      cb.once = true;
      return cb();
    }
  };
};

export const dialectOf = function(lang) {
  if ((lang != null) && _.indexOf(lang, "-") >= 0) {
    return lang.replace(/-.*/, "");
  }
  return null;
};

export const now = function() {
  return new Date().getTime();
};

