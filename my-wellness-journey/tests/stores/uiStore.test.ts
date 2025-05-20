import { act } from "@testing-library/react";
import { useUIStore } from "@/stores/uiStore";

describe("uiStore", () => {
  // Reset the store state before each test
  beforeEach(() => {
    act(() => {
      useUIStore.setState({
        isMobileMenuOpen: false,
        isLoading: false,
        error: null,
        hasData: false
      });
    });
  });

  describe("initial state", () => {
    it("should have the correct initial state", () => {
      const state = useUIStore.getState();
      
      expect(state.isMobileMenuOpen).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.hasData).toBe(false);
    });
  });

  describe("toggleMobileMenu", () => {
    it("should toggle the mobile menu state from false to true", () => {
      // Initial state should be false
      expect(useUIStore.getState().isMobileMenuOpen).toBe(false);
      
      // Toggle the mobile menu
      act(() => {
        useUIStore.getState().toggleMobileMenu();
      });
      
      // State should now be true
      expect(useUIStore.getState().isMobileMenuOpen).toBe(true);
    });

    it("should toggle the mobile menu state from true to false", () => {
      // Set initial state to true
      act(() => {
        useUIStore.setState({ isMobileMenuOpen: true });
      });
      
      expect(useUIStore.getState().isMobileMenuOpen).toBe(true);
      
      // Toggle the mobile menu
      act(() => {
        useUIStore.getState().toggleMobileMenu();
      });
      
      // State should now be false
      expect(useUIStore.getState().isMobileMenuOpen).toBe(false);
    });
    
    it("should toggle multiple times correctly", () => {
      // Start with false
      expect(useUIStore.getState().isMobileMenuOpen).toBe(false);
      
      // First toggle: false -> true
      act(() => {
        useUIStore.getState().toggleMobileMenu();
      });
      expect(useUIStore.getState().isMobileMenuOpen).toBe(true);
      
      // Second toggle: true -> false
      act(() => {
        useUIStore.getState().toggleMobileMenu();
      });
      expect(useUIStore.getState().isMobileMenuOpen).toBe(false);
      
      // Third toggle: false -> true
      act(() => {
        useUIStore.getState().toggleMobileMenu();
      });
      expect(useUIStore.getState().isMobileMenuOpen).toBe(true);
    });
  });

  describe("setLoading", () => {
    it("should set loading state to true", () => {
      act(() => {
        useUIStore.getState().setLoading(true);
      });
      
      expect(useUIStore.getState().isLoading).toBe(true);
    });

    it("should set loading state to false", () => {
      // First set to true
      act(() => {
        useUIStore.setState({ isLoading: true });
      });
      
      // Then set to false
      act(() => {
        useUIStore.getState().setLoading(false);
      });
      
      expect(useUIStore.getState().isLoading).toBe(false);
    });
  });

  describe("setError", () => {
    it("should set error state with a message", () => {
      const errorMessage = "Test error message";
      
      act(() => {
        useUIStore.getState().setError(errorMessage);
      });
      
      expect(useUIStore.getState().error).toBe(errorMessage);
    });

    it("should clear error state when null is passed", () => {
      // First set an error
      act(() => {
        useUIStore.setState({ error: "Some error" });
      });
      
      // Then clear it
      act(() => {
        useUIStore.getState().setError(null);
      });
      
      expect(useUIStore.getState().error).toBeNull();
    });
  });

  describe("setHasData", () => {
    it("should set hasData state to true", () => {
      act(() => {
        useUIStore.getState().setHasData(true);
      });
      
      expect(useUIStore.getState().hasData).toBe(true);
    });

    it("should set hasData state to false", () => {
      // First set to true
      act(() => {
        useUIStore.setState({ hasData: true });
      });
      
      // Then set to false
      act(() => {
        useUIStore.getState().setHasData(false);
      });
      
      expect(useUIStore.getState().hasData).toBe(false);
    });
  });

  describe("combined actions", () => {
    it("should handle multiple state changes correctly", () => {
      // Initial state verification
      const initialState = useUIStore.getState();
      expect(initialState.isMobileMenuOpen).toBe(false);
      expect(initialState.isLoading).toBe(false);
      expect(initialState.error).toBeNull();
      expect(initialState.hasData).toBe(false);
      
      // Change multiple states
      act(() => {
        useUIStore.getState().toggleMobileMenu(); // Set to true
        useUIStore.getState().setLoading(true);
        useUIStore.getState().setError("Some error");
        useUIStore.getState().setHasData(true);
      });
      
      // Verify all changes
      const updatedState = useUIStore.getState();
      expect(updatedState.isMobileMenuOpen).toBe(true);
      expect(updatedState.isLoading).toBe(true);
      expect(updatedState.error).toBe("Some error");
      expect(updatedState.hasData).toBe(true);
      
      // Reset some states
      act(() => {
        useUIStore.getState().toggleMobileMenu(); // Set to false
        useUIStore.getState().setError(null);
      });
      
      // Verify partial update
      const finalState = useUIStore.getState();
      expect(finalState.isMobileMenuOpen).toBe(false);
      expect(finalState.isLoading).toBe(true); // Unchanged
      expect(finalState.error).toBeNull();
      expect(finalState.hasData).toBe(true); // Unchanged
    });
  });
});
