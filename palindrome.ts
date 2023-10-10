export const isPalindrome = (s: string): boolean => {
    const cleanedString = s.replace(/[^A-Za-z0-9]/g, '').toLowerCase();
    const reversedString = cleanedString.split('').reverse().join('');
    return cleanedString === reversedString;
};
