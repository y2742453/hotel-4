import { jest } from "@jest/globals";

test("Testing test", () => {
  // Préparation
  let test = "allo";

  // Execution
  test = test.toUpperCase();

  // Verification
  expect(test).toBe("ALLO");
});
