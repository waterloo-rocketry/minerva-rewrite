import { isPalindrome } from './palindrome';

describe('isPalindrome', () => {
    it('should return true for palindromic strings', () => {
        expect(isPalindrome('radar')).toBe(true);
        expect(isPalindrome('A man, a plan, a canal, Panama!')).toBe(true);
    });

    it('should return false for non-palindromic strings', () => {
        expect(isPalindrome('hello')).toBe(false);
        expect(isPalindrome('OpenAI')).toBe(false);
    });
});
