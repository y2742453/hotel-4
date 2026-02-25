import { jest } from "@jest/globals";

test("Testing test", () => {
  // Préparation
  let test = "works";

  // Execution
  test = test.toUpperCase();

  // Verification
  expect(test).toBe("WORKS");
});
