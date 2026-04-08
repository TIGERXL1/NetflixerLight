// __tests__/sum.test.js
// Test simple pour vérifier que Jest fonctionne

// Fonction simple à tester
function sum(a, b) {
  return a + b;
}

// Groupe de tests
describe('Sum Function', () => {
  
  // Test 1
  test('adds 1 + 2 to equal 3', () => {
    expect(sum(1, 2)).toBe(3);
  });

  // Test 2
  test('adds -1 + 1 to equal 0', () => {
    expect(sum(-1, 1)).toBe(0);
  });

  // Test 3
  test('adds 0 + 0 to equal 0', () => {
    expect(sum(0, 0)).toBe(0);
  });
});
