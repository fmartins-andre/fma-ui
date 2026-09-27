import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "./input-otp";
import meta from "./meta.json";

const componentMeta = {
  title: "ui/InputOtp",
  component: InputOTP,
  tags: ["autodocs"],
  parameters: {
    docs: { description: { component: meta.description } },
  },
  args: {
    maxLength: 6,
    // OTPInputProps is a discriminated union (render XOR children) — this
    // placeholder only satisfies the "children" branch for CSF3's types.
    children: null,
  },
  // Only the specific prop we vary (maxLength) is passed through below,
  // rather than spreading all of `args` — spreading would re-introduce the
  // same union-typing conflict at the JSX call site.
  render: (args) => (
    <InputOTP maxLength={args.maxLength}>
      <InputOTPGroup>
        <InputOTPSlot index={0} />
        <InputOTPSlot index={1} />
        <InputOTPSlot index={2} />
      </InputOTPGroup>
      <InputOTPSeparator />
      <InputOTPGroup>
        <InputOTPSlot index={3} />
        <InputOTPSlot index={4} />
        <InputOTPSlot index={5} />
      </InputOTPGroup>
    </InputOTP>
  ),
} satisfies Meta<typeof InputOTP>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

export const Default: Story = {
  parameters: {
    docs: { description: { story: "Six boxed slots split into two groups by a separator." } },
  },
};

export const Typing: Story = {
  parameters: {
    docs: {
      description: { story: "Verifies typing fills the hidden input and every visible slot." },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const hiddenInput = canvas.getByRole("textbox", { hidden: true });
    await userEvent.type(hiddenInput, "123456");
    expect(hiddenInput).toHaveValue("123456");
  },
};
