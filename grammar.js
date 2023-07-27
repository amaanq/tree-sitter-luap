/**
 * @file Luap grammar for tree-sitter
 * @author Vhyrro <vhyrro@gmail.com>
 * @author Amaan Qureshi <amaanq12@gmail.com>
 * @license MIT
 * @see {@link https://www.lua.org/pil/20.2.html|official syntax spec}
 */

/* eslint-disable arrow-parens */
/* eslint-disable camelcase */
/* eslint-disable-next-line spaced-comment */
/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
  name: 'luap',

  inline: $ => [
    $.quantifier,
  ],

  conflicts: $ => [
    [$.range, $.set],
  ],

  rules: {
    pattern: $ => seq(
      optional($.anchor_begin),
      repeat(
        choice(
          alias(token.immediate('$'), $.character), // To resolve ambiguities with the end anchor
          $.character,
          $.class_pattern,
          $.set,
          $.negated_set,
          $.capture,
        ),
      ),
      optional($.anchor_end),
    ),

    anchor_begin: _ => token.immediate('^'),
    anchor_end: _ => prec(1, token.immediate('$')),

    _raw_character: _ => choice(token.immediate(/[^%\(\[\.\n]/), '.'),

    character: $ => seq(
      $._raw_character,
      optional($.quantifier),
    ),

    escape_char: _ => token.immediate(/\W/),
    capture_index: _ => token.immediate(/[1-9]/),
    balanced_match: $ => seq(
      token.immediate('b'),
      field('first', alias(token.immediate(/./), $.character)),
      field('last', alias(token.immediate(/./), $.character)),
    ),

    frontier_pattern: $ => seq(
      token.immediate('%f'),
      choice(
        $.set,
        $.negated_set,
      ),
    ),

    zero_or_more: _ => token.immediate('*'),
    shortest_zero_or_more: _ => token.immediate('-'),
    one_or_more: _ => token.immediate('+'),
    zero_or_one: _ => token.immediate('?'),

    quantifier: $ => choice(
      $.zero_or_more,
      $.shortest_zero_or_more,
      $.one_or_more,
      $.zero_or_one,
    ),

    class: $ => seq(
      token.immediate('%'),
      choice(
        /[acdglpsuwxACDGLPSUWX]/,
        $.capture_index,
        $.balanced_match,
        $.escape_char,
      ),
    ),

    class_pattern: $ => prec.right(seq(
      choice($.class, $.frontier_pattern),
      optional($.quantifier),
    )),

    range: $ => prec.dynamic(1, seq(
      field('from', alias($._raw_character, $.character)),
      token.immediate('-'),
      field('to', alias(/[^\]]/, $.character)),
    )),

    set: $ => prec.left(seq(
      token.immediate('['),
      repeat1(
        choice(
          alias($._raw_character, $.character),
          alias(token.immediate('-'), $.character),
          alias(token.immediate('('), $.character),
          $.range,
          $.class,
        ),
      ),
      token.immediate(']'),
      optional($.quantifier),
    )),

    negated_set: $ => prec.left(seq(
      token.immediate('['),
      token.immediate('^'),
      repeat1(
        choice(
          alias($._raw_character, $.character),
          alias(token.immediate('-'), $.character),
          alias(token.immediate('('), $.character),
          $.range,
          $.class,
        ),
      ),
      token.immediate(']'),
      optional($.quantifier),
    )),

    capture: $ => seq(
      token.immediate('('),
      repeat(
        choice(
          $.set,
          $.negated_set,
          $.class_pattern,
          $.character,
          $.capture,
        ),
      ),
      token.immediate(')'),
      optional($.quantifier),
    ),
  },
});
