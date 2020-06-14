import * as TestSubject from './index';

describe(`${TestSubject.libname} ${TestSubject.libversion}`, () => {
  describe('exports', () => {
    it('libname', () => {
      expect(TestSubject.libname).toBe('jhu-covid19');
    });

    it('libversion', () => {
      expect(TestSubject.libversion).toBe('0.0.3');
    });

    it('liburl', () => {
      expect(TestSubject.liburl).toMatch(/^https/);
    });

    it('default', () => {
      expect(TestSubject.default).toBeDefined();
    });

    it('Provider', () => {
      expect(TestSubject.Provider).toBeDefined();
    });

    it('Provider = default', () => {
      expect(TestSubject.Provider).toStrictEqual(TestSubject.default);
    });
  });
});
