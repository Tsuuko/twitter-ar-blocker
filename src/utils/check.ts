import emojiRegex from 'emoji-regex';

export const checkContainsArabic = (text: string, length: number) => {
  const arabicRegex = new RegExp(`[\\u0600-\\u06FF]{${length},}`);
  return arabicRegex.test(text);
};

export const checkContainsEmoji = (
  text: string,
  options?: {
    length?: number;
    onlyEmoji?: boolean;
  }
) => {
  const { length = 1, onlyEmoji = false } = options || {};

  if (onlyEmoji) {
    const segmenter = new Intl.Segmenter('ja', { granularity: 'grapheme' });
    const textLength = [...segmenter.segment(text.replace(/(@.*) /, ''))]
      .length;
    const emoji = new RegExp(`(${emojiRegex()}){${textLength}}`, '');
    return textLength >= length && emoji.test(text);
  }

  const emoji = new RegExp(`(${emojiRegex()}){${length}}`, '');
  return emoji.test(text);
};
