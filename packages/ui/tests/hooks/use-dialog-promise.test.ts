// @vitest-environment happy-dom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, expectTypeOf, it } from "vitest";
import {
  type DialogController,
  type DialogResult,
  useDialogPromise,
} from "@/hooks/use-dialog-promise";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root;
let controller: DialogController<{ id: number }, string>;

function Harness() {
  controller = useDialogPromise<{ id: number }, string>();
  return null;
}

beforeEach(() => {
  root = createRoot(document.createElement("div"));
  act(() => root.render(createElement(Harness)));
});

afterEach(() => {
  act(() => root.unmount());
});

/** Opens and returns the pending result. */
function openWith(id: number) {
  let result!: Promise<DialogResult<string>>;
  act(() => {
    result = controller.open({ id });
  });
  return result;
}

describe("useDialogPromise", () => {
  it("opens with the given data", () => {
    void openWith(7);
    expect(controller.isOpen).toBe(true);
    expect(controller.dialogProps.isOpen).toBe(true);
    expect(controller.data).toEqual({ id: 7 });
  });

  it("resolves confirmed with the value and closes", async () => {
    const result = openWith(1);
    await act(() => controller.confirm("2030-06-01"));
    await expect(result).resolves.toEqual({ status: "confirmed", value: "2030-06-01" });
    expect(controller.isOpen).toBe(false);
    // Data stays for the exit animation.
    expect(controller.data).toEqual({ id: 1 });
  });

  it("resolves cancelled, and ignores the close request that follows", async () => {
    const result = openWith(1);
    act(() => {
      controller.cancel();
      controller.dialogProps.onOpenChange(false);
    });
    await expect(result).resolves.toEqual({ status: "cancelled" });
  });

  it("resolves dismissed on a close request (Escape, outside click)", async () => {
    const result = openWith(1);
    act(() => controller.dialogProps.onOpenChange(false));
    await expect(result).resolves.toEqual({ status: "dismissed" });
    expect(controller.isOpen).toBe(false);
  });

  it("keeps the dialog open and pending during an async confirm", async () => {
    const result = openWith(1);
    let finish!: (value: string) => void;
    let done!: Promise<void>;
    act(() => {
      done = controller.confirm(() => new Promise<string>((resolve) => (finish = resolve)));
    });
    expect(controller.isPending).toBe(true);
    // Escape and cancel are ignored while it works.
    act(() => {
      controller.dialogProps.onOpenChange(false);
      controller.cancel();
    });
    expect(controller.isOpen).toBe(true);

    await act(async () => {
      finish("saved");
      await done;
    });
    await expect(result).resolves.toEqual({ status: "confirmed", value: "saved" });
    expect(controller.isPending).toBe(false);
  });

  it("stays open with the error when an async confirm throws", async () => {
    const result = openWith(1);
    const failure = new Error("network");
    await act(() =>
      controller.confirm(async () => {
        throw failure;
      }),
    );
    expect(controller.isOpen).toBe(true);
    expect(controller.isPending).toBe(false);
    expect(controller.error).toBe(failure);

    await act(() => controller.confirm("retry"));
    await expect(result).resolves.toEqual({ status: "confirmed", value: "retry" });
  });

  it("dismisses the previous call when opened again", async () => {
    const first = openWith(1);
    const second = openWith(2);
    await expect(first).resolves.toEqual({ status: "dismissed" });
    expect(controller.data).toEqual({ id: 2 });
    act(() => controller.cancel());
    await expect(second).resolves.toEqual({ status: "cancelled" });
  });

  it("dismisses an open dialog on unmount", async () => {
    const result = openWith(1);
    act(() => root.unmount());
    await expect(result).resolves.toEqual({ status: "dismissed" });
    root = createRoot(document.createElement("div"));
  });

  it("ignores confirm and cancel when nothing is open", () => {
    act(() => {
      void controller.confirm("x");
      controller.cancel();
    });
    expect(controller.isOpen).toBe(false);
  });
});

describe("useDialogPromise types", () => {
  it("types the result value and the data", () => {
    expectTypeOf<DialogResult<string>>().toExtend<
      { status: "confirmed"; value: string } | { status: "cancelled" } | { status: "dismissed" }
    >();
    expectTypeOf<DialogController<{ id: number }, string>["open"]>()
      .parameter(0)
      .toEqualTypeOf<{ id: number }>();
  });

  it("makes data and value optional when they are void", () => {
    expectTypeOf<DialogController["open"]>().toBeCallableWith();
    expectTypeOf<DialogController["confirm"]>().toBeCallableWith();
    expectTypeOf<DialogController<void, number>["confirm"]>().toBeCallableWith(1);
  });
});
