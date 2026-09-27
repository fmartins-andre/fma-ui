import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import meta from "./meta.json";
import {
  Questionnaire,
  QuestionnaireActions,
  QuestionnaireChoice,
  QuestionnaireChoices,
  QuestionnaireInput,
  QuestionnaireItem,
  QuestionnaireNext,
  QuestionnairePrevious,
  QuestionnaireProgress,
  QuestionnaireSubmit,
  QuestionnaireTitle,
} from "./questionnaire";

// Questionnaire wraps @shadcn/react/questionnaire, not react-aria-components —
// upstream hasn't ported this one to the aria base yet either (see meta.json).
const componentMeta = {
  title: "ui/Questionnaire",
  component: Questionnaire,
  tags: ["autodocs"],
  parameters: {
    docs: { description: { component: meta.description } },
  },
} satisfies Meta<typeof Questionnaire>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

const items = [
  { name: "role", required: true },
  { name: "feedback", required: false },
] as const;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: "A two-step flow (choices, then a text input) — Next advances, Previous goes back.",
      },
    },
  },
  render: () => (
    <Questionnaire items={items} defaultItem="role" className="w-96">
      <QuestionnaireProgress />
      <QuestionnaireItem name="role">
        <QuestionnaireTitle>What&apos;s your role?</QuestionnaireTitle>
        <QuestionnaireChoices>
          <QuestionnaireChoice value="developer">Developer</QuestionnaireChoice>
          <QuestionnaireChoice value="designer">Designer</QuestionnaireChoice>
          <QuestionnaireChoice value="manager">Manager</QuestionnaireChoice>
        </QuestionnaireChoices>
        <QuestionnaireActions>
          <QuestionnairePrevious />
          <QuestionnaireNext />
        </QuestionnaireActions>
      </QuestionnaireItem>
      <QuestionnaireItem name="feedback">
        <QuestionnaireTitle>Any feedback?</QuestionnaireTitle>
        <QuestionnaireInput placeholder="Optional" />
        <QuestionnaireActions>
          <QuestionnairePrevious />
          <QuestionnaireSubmit />
        </QuestionnaireActions>
      </QuestionnaireItem>
    </Questionnaire>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByText("What's your role?")).toBeVisible();
    await userEvent.click(canvas.getByText("Developer"));
    await userEvent.click(canvas.getByRole("button", { name: "Next" }));
    expect(canvas.getByText("Any feedback?")).toBeVisible();
  },
};
