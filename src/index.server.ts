const toolbar = plugin.CreateToolbar("GuiScaling");
const scale_button = toolbar.CreateButton(
	"ScaleButton",
	"Scale",
	"rbxassetid://18566756358",
	"Scale",
);

const offset_button = toolbar.CreateButton(
	"OffsetButton",
	"Offset",
	"rbxassetid://18566763620",
	"Offset",
);

const selection = game.GetService("Selection");
const change_history_service = game.GetService("ChangeHistoryService");
scale_button.Click.Connect(() => {
	ProcessObjects(ObjectToScale);
});

offset_button.Click.Connect(() => {
	ProcessObjects(ObjectToPixels);
});

function ProcessObjects(callback: (instance: Instance) => void) {
	const id = change_history_service.TryBeginRecording("Transform", "Transform");
	const instances = selection.Get();
	instances.forEach(callback);
	if (id === undefined) {
		warn("History save was not successful");
		return;
	}
	change_history_service.FinishRecording(
		id,
		Enum.FinishRecordingOperation.Commit,
		undefined,
	);
}

function SummUpUIPaddings(instance: GuiBase2d) {
	let offset = Vector2.zero;
	const ui_paddings = <UIPadding[]>(
		instance.GetChildren().filter((child) => child.IsA("UIPadding"))
	);

	for (const padding of ui_paddings) {
		const scale_offset = new Vector2(
			padding.PaddingLeft.Scale + padding.PaddingRight.Scale,
			padding.PaddingTop.Scale + padding.PaddingBottom.Scale,
		);

		const pixel_offset = new Vector2(
			padding.PaddingLeft.Offset + padding.PaddingRight.Offset,
			padding.PaddingTop.Offset + padding.PaddingBottom.Offset,
		);

		offset = offset
			.add(scale_offset.mul(instance.AbsoluteSize))
			.add(pixel_offset);
	}

	return offset;
}

function ObjectToPixels(object: Instance) {
	const parent = object.Parent;
	if (parent === undefined) return;
	if (!parent.IsA("GuiBase2d")) return;
	if (object.IsA("UIPadding")) {
		const parent_absolute_size = parent.AbsoluteSize;
		object.PaddingLeft = new UDim(
			0,
			object.PaddingLeft.Scale * parent_absolute_size.X +
				object.PaddingLeft.Offset,
		);

		object.PaddingRight = new UDim(
			0,
			object.PaddingRight.Scale * parent_absolute_size.X +
				object.PaddingRight.Offset,
		);

		object.PaddingTop = new UDim(
			0,
			object.PaddingTop.Scale * parent_absolute_size.Y +
				object.PaddingTop.Offset,
		);

		object.PaddingBottom = new UDim(
			0,
			object.PaddingBottom.Scale * parent_absolute_size.Y +
				object.PaddingBottom.Offset,
		);

		return;
	}

	const offset = SummUpUIPaddings(parent);
	const parent_absolute_size = parent.AbsoluteSize.add(offset);

	if (object.IsA("GuiObject")) {
		const size = object.AbsoluteSize;
		const position = new Vector2(
			object.Position.X.Offset +
				object.Position.X.Scale * parent_absolute_size.X,
			object.Position.Y.Offset +
				object.Position.Y.Scale * parent_absolute_size.Y,
		);

		object.Position = UDim2.fromOffset(position.X, position.Y);

		object.Size = UDim2.fromOffset(size.X, size.Y);
	} else if (object.IsA("UIListLayout")) {
		const main_size =
			object.FillDirection === Enum.FillDirection.Horizontal
				? parent_absolute_size.X
				: parent_absolute_size.Y;
		const size = object.Padding.Offset + object.Padding.Scale * main_size;
		object.Padding = new UDim(0, size);
	} else if (object.IsA("UIGridLayout")) {
		const padding = new Vector2(
			object.CellPadding.X.Scale * parent_absolute_size.X +
				object.CellPadding.X.Offset,
			object.CellPadding.Y.Scale * parent_absolute_size.Y +
				object.CellPadding.Y.Offset,
		);

		const cell_size = new Vector2(
			object.CellSize.X.Scale * parent_absolute_size.X +
				object.CellSize.X.Offset,
			object.CellSize.Y.Scale * parent_absolute_size.Y +
				object.CellSize.Y.Offset,
		);

		object.CellPadding = UDim2.fromOffset(padding.X, padding.Y);
		object.CellSize = UDim2.fromOffset(cell_size.X, cell_size.Y);
	} else if (object.IsA("UITableLayout")) {
		const padding_offset = new Vector2(
			object.Padding.X.Offset,
			object.Padding.Y.Offset,
		);
		const padding_scale = new Vector2(
			object.Padding.X.Scale,
			object.Padding.Y.Scale,
		);

		const padding = padding_scale.mul(parent_absolute_size).add(padding_offset);

		object.Padding = UDim2.fromOffset(padding.X, padding.Y);
	} else if (object.IsA("UIPageLayout")) {
		const main_size =
			object.FillDirection === Enum.FillDirection.Horizontal
				? parent_absolute_size.X
				: parent_absolute_size.Y;

		object.Padding = new UDim(
			0,
			object.Padding.Scale * main_size + object.Padding.Offset,
		);
	}
}

function ObjectToScale(object: Instance) {
	const parent = object.Parent;
	if (parent === undefined) return;
	if (!parent.IsA("GuiBase2d")) return;
	if (object.IsA("UIPadding")) {
		const parent_absolute_size = parent.AbsoluteSize;
		object.PaddingLeft = new UDim(
			object.PaddingLeft.Scale +
				object.PaddingLeft.Offset / parent_absolute_size.X,
			0,
		);

		object.PaddingRight = new UDim(
			object.PaddingRight.Scale +
				object.PaddingRight.Offset / parent_absolute_size.X,
			0,
		);

		object.PaddingTop = new UDim(
			object.PaddingTop.Scale +
				object.PaddingTop.Offset / parent_absolute_size.Y,
			0,
		);

		object.PaddingBottom = new UDim(
			object.PaddingBottom.Scale +
				object.PaddingBottom.Offset / parent_absolute_size.Y,
			0,
		);

		return;
	}

	const offset = SummUpUIPaddings(parent);

	let parent_absolute_size = parent.AbsoluteSize.sub(offset);
	parent_absolute_size = new Vector2(
		parent_absolute_size.X === 0 ? 1 : parent_absolute_size.X,
		parent_absolute_size.Y === 0 ? 1 : parent_absolute_size.Y,
	);

	if (object.IsA("GuiObject")) {
		const size = object.AbsoluteSize;
		const position = new Vector2(
			object.Position.X.Offset +
				object.Position.X.Scale * parent_absolute_size.X,
			object.Position.Y.Offset +
				object.Position.Y.Scale * parent_absolute_size.Y,
		);

		const position_ratio = position.div(parent_absolute_size);
		object.Position = UDim2.fromScale(position_ratio.X, position_ratio.Y);

		const size_ratio = size.div(parent_absolute_size);
		object.Size = UDim2.fromScale(size_ratio.X, size_ratio.Y);
	} else if (object.IsA("UIListLayout")) {
		const main_size =
			object.FillDirection === Enum.FillDirection.Horizontal
				? parent_absolute_size.X
				: parent_absolute_size.Y;
		const size = object.Padding.Offset + object.Padding.Scale * main_size;
		object.Padding = new UDim(size / main_size, 0);
	} else if (object.IsA("UIGridLayout")) {
		const padding = new Vector2(
			object.CellPadding.X.Scale * parent_absolute_size.X +
				object.CellPadding.X.Offset,
			object.CellPadding.Y.Scale * parent_absolute_size.Y +
				object.CellPadding.Y.Offset,
		);

		const padding_ratio = padding.div(parent_absolute_size);

		const cell_size = new Vector2(
			object.CellSize.X.Scale * parent_absolute_size.X +
				object.CellSize.X.Offset,
			object.CellSize.Y.Scale * parent_absolute_size.Y +
				object.CellSize.Y.Offset,
		);

		const cell_ratio = cell_size.div(parent_absolute_size);

		object.CellPadding = UDim2.fromScale(padding_ratio.X, padding_ratio.Y);
		object.CellSize = UDim2.fromScale(cell_ratio.X, cell_ratio.Y);
	} else if (object.IsA("UITableLayout")) {
		const padding_offset = new Vector2(
			object.Padding.X.Offset,
			object.Padding.Y.Offset,
		);
		const padding_scale = new Vector2(
			object.Padding.X.Scale,
			object.Padding.Y.Scale,
		);

		const padding = padding_scale.add(padding_offset.div(parent_absolute_size));

		object.Padding = UDim2.fromScale(padding.X, padding.Y);
	} else if (object.IsA("UIPageLayout")) {
		const main_size =
			object.FillDirection === Enum.FillDirection.Horizontal
				? parent_absolute_size.X
				: parent_absolute_size.Y;

		object.Padding = new UDim(
			object.Padding.Scale + object.Padding.Offset / main_size,
			0,
		);
	}
}
