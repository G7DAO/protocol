package main

import (
	"testing"
)

func TestParseLabels(t *testing.T) {
	text := `
This is a test file containing some labels, like LABEL-123.

ANOTHERLABEL-x

WILDCARD-*

Labels need to have a sequence of lowercase characters and digits after the hyphen. Strings like INCOMPLETE- do not match.
`

	expected := []ParsedLabel{
		{TagStartPosition: 50, TagEndPosition: 55, ModifierStartPosition: 56, ModifierEndPosition: 59, Tag: "LABEL", Modifier: "123", ModifierIsInt: true, ModifierAsInt: 123},
		{TagStartPosition: 62, TagEndPosition: 74, ModifierStartPosition: 75, ModifierEndPosition: 76, Tag: "ANOTHERLABEL", Modifier: "x", ModifierIsInt: false},
		{TagStartPosition: 78, TagEndPosition: 86, ModifierStartPosition: 87, ModifierEndPosition: 88, Tag: "WILDCARD", Modifier: "*", ModifierIsInt: false},
	}

	labels := ParseLabels([]byte(text))

	if len(labels) != len(expected) {
		t.Fatalf("Expected %d labels, got %d", len(expected), len(labels))
	}

	for i, expectedLabel := range expected {
		if labels[i].TagStartPosition != expectedLabel.TagStartPosition {
			t.Fatalf("Index %d: Expected tag start position %d, got %d", i, expectedLabel.TagStartPosition, labels[i].TagStartPosition)
		}
		if labels[i].TagEndPosition != expectedLabel.TagEndPosition {
			t.Fatalf("Index %d: Expected tag end position %d, got %d", i, expectedLabel.TagEndPosition, labels[i].TagEndPosition)
		}
		if labels[i].ModifierStartPosition != expectedLabel.ModifierStartPosition {
			t.Fatalf("Index %d: Expected modifier start position %d, got %d", i, expectedLabel.ModifierStartPosition, labels[i].ModifierStartPosition)
		}
		if labels[i].ModifierEndPosition != expectedLabel.ModifierEndPosition {
			t.Fatalf("Index %d: Expected modifier end position %d, got %d", i, expectedLabel.ModifierEndPosition, labels[i].ModifierEndPosition)
		}
		if labels[i].Tag != expectedLabel.Tag {
			t.Fatalf("Index %d: Expected tag %s, got %s", i, expectedLabel.Tag, labels[i].Tag)
		}
		if labels[i].Modifier != expectedLabel.Modifier {
			t.Fatalf("Index %d: Expected modifier %s, got %s", i, expectedLabel.Modifier, labels[i].Modifier)
		}
		if labels[i].ModifierIsInt != expectedLabel.ModifierIsInt {
			t.Fatalf("Index %d: Expected modifierIsInt %t, got %t", i, expectedLabel.ModifierIsInt, labels[i].ModifierIsInt)
		}
		if labels[i].ModifierAsInt != expectedLabel.ModifierAsInt {
			t.Fatalf("Index %d: Expected modifierAsInt %d, got %d", i, expectedLabel.ModifierAsInt, labels[i].ModifierAsInt)
		}
		if labels[i].IncludesLineNumbers != expectedLabel.IncludesLineNumbers {
			t.Fatalf("Index %d: Expected IncludesLineNumbers %t, got %t", i, expectedLabel.IncludesLineNumbers, labels[i].IncludesLineNumbers)
		}
		if labels[i].LineNumber != expectedLabel.LineNumber {
			t.Fatalf("Index %d: Expected LineNumber %d, got %d", i, expectedLabel.LineNumber, labels[i].LineNumber)
		}
	}
}

func TestParseLabelsWithBackticks(t *testing.T) {
	text := "### `TAG-5`: lol"

	expected := ParsedLabel{TagStartPosition: 5, TagEndPosition: 8, ModifierStartPosition: 9, ModifierEndPosition: 10, Tag: "TAG", Modifier: "5", ModifierIsInt: true, ModifierAsInt: 5}

	labels := ParseLabels([]byte(text))

	if len(labels) != 1 {
		t.Fatalf("Expected 1 label, got %d", len(labels))
	}

	if labels[0].TagStartPosition != expected.TagStartPosition {
		t.Fatalf("Expected tag start position %d, got %d", expected.TagStartPosition, labels[0].TagStartPosition)
	}
	if labels[0].TagEndPosition != expected.TagEndPosition {
		t.Fatalf("Expected tag end position %d, got %d", expected.TagEndPosition, labels[0].TagEndPosition)
	}
	if labels[0].ModifierStartPosition != expected.ModifierStartPosition {
		t.Fatalf("Expected modifier start position %d, got %d", expected.ModifierStartPosition, labels[0].ModifierStartPosition)
	}
	if labels[0].ModifierEndPosition != expected.ModifierEndPosition {
		t.Fatalf("Expected modifier end position %d, got %d", expected.ModifierEndPosition, labels[0].ModifierEndPosition)
	}
	if labels[0].Tag != expected.Tag {
		t.Fatalf("Expected tag %s, got %s", expected.Tag, labels[0].Tag)
	}
	if labels[0].Modifier != expected.Modifier {
		t.Fatalf("Expected modifier %s, got %s", expected.Modifier, labels[0].Modifier)
	}
	if labels[0].ModifierIsInt != expected.ModifierIsInt {
		t.Fatalf("Expected modifierIsInt %t, got %t", expected.ModifierIsInt, labels[0].ModifierIsInt)
	}
	if labels[0].ModifierAsInt != expected.ModifierAsInt {
		t.Fatalf("Expected modifierAsInt %d, got %d", expected.ModifierAsInt, labels[0].ModifierAsInt)
	}
	if labels[0].IncludesLineNumbers != expected.IncludesLineNumbers {
		t.Fatalf("Expected IncludesLineNumbers %t, got %t", expected.IncludesLineNumbers, labels[0].IncludesLineNumbers)
	}
	if labels[0].LineNumber != expected.LineNumber {
		t.Fatalf("Expected LineNumber %d, got %d", expected.LineNumber, labels[0].LineNumber)
	}
}

func TestParseLabelsDoesNotRecognizeModifiersWithUppercaseCharacters(t *testing.T) {
	text := "### `TAG-ANOTHERTAG-5`: lol"

	expected := ParsedLabel{TagStartPosition: 9, TagEndPosition: 19, ModifierStartPosition: 20, ModifierEndPosition: 21, Tag: "ANOTHERTAG", Modifier: "5", ModifierIsInt: true, ModifierAsInt: 5}

	labels := ParseLabels([]byte(text))

	if len(labels) != 1 {
		t.Fatalf("Expected 1 label, got %d", len(labels))
	}

	if labels[0].TagStartPosition != expected.TagStartPosition {
		t.Fatalf("Expected tag start position %d, got %d", expected.TagStartPosition, labels[0].TagStartPosition)
	}
	if labels[0].TagEndPosition != expected.TagEndPosition {
		t.Fatalf("Expected tag end position %d, got %d", expected.TagEndPosition, labels[0].TagEndPosition)
	}
	if labels[0].ModifierStartPosition != expected.ModifierStartPosition {
		t.Fatalf("Expected modifier start position %d, got %d", expected.ModifierStartPosition, labels[0].ModifierStartPosition)
	}
	if labels[0].ModifierEndPosition != expected.ModifierEndPosition {
		t.Fatalf("Expected modifier end position %d, got %d", expected.ModifierEndPosition, labels[0].ModifierEndPosition)
	}
	if labels[0].Tag != expected.Tag {
		t.Fatalf("Expected tag %s, got %s", expected.Tag, labels[0].Tag)
	}
	if labels[0].Modifier != expected.Modifier {
		t.Fatalf("Expected modifier %s, got %s", expected.Modifier, labels[0].Modifier)
	}
	if labels[0].ModifierIsInt != expected.ModifierIsInt {
		t.Fatalf("Expected modifierIsInt %t, got %t", expected.ModifierIsInt, labels[0].ModifierIsInt)
	}
	if labels[0].ModifierAsInt != expected.ModifierAsInt {
		t.Fatalf("Expected modifierAsInt %d, got %d", expected.ModifierAsInt, labels[0].ModifierAsInt)
	}
	if labels[0].IncludesLineNumbers != expected.IncludesLineNumbers {
		t.Fatalf("Expected IncludesLineNumbers %t, got %t", expected.IncludesLineNumbers, labels[0].IncludesLineNumbers)
	}
	if labels[0].LineNumber != expected.LineNumber {
		t.Fatalf("Expected LineNumber %d, got %d", expected.LineNumber, labels[0].LineNumber)
	}
}

func TestParseLabelsWithLineNumbers(t *testing.T) {
	text := `
This is a test file containing some labels, like LABEL-123.

ANOTHERLABEL-x

WILDCARD-*

Labels need to have a sequence of lowercase characters and digits after the hyphen. Strings like INCOMPLETE- do not match.
`

	expected := []ParsedLabel{
		{TagStartPosition: 49, TagEndPosition: 54, ModifierStartPosition: 55, ModifierEndPosition: 58, Tag: "LABEL", Modifier: "123", ModifierIsInt: true, ModifierAsInt: 123, IncludesLineNumbers: true, LineNumber: 2},
		{TagStartPosition: 0, TagEndPosition: 12, ModifierStartPosition: 13, ModifierEndPosition: 14, Tag: "ANOTHERLABEL", Modifier: "x", ModifierIsInt: false, IncludesLineNumbers: true, LineNumber: 4},
		{TagStartPosition: 0, TagEndPosition: 8, ModifierStartPosition: 9, ModifierEndPosition: 10, Tag: "WILDCARD", Modifier: "*", ModifierIsInt: false, IncludesLineNumbers: true, LineNumber: 6},
	}

	labels := ParseLabelsWithLineNumbers([]byte(text))

	if len(labels) != len(expected) {
		t.Fatalf("Expected %d labels, got %d", len(expected), len(labels))
	}

	for i, expectedLabel := range expected {
		if labels[i].TagStartPosition != expectedLabel.TagStartPosition {
			t.Fatalf("Index %d: Expected tag start position %d, got %d", i, expectedLabel.TagStartPosition, labels[i].TagStartPosition)
		}
		if labels[i].TagEndPosition != expectedLabel.TagEndPosition {
			t.Fatalf("Index %d: Expected tag end position %d, got %d", i, expectedLabel.TagEndPosition, labels[i].TagEndPosition)
		}
		if labels[i].ModifierStartPosition != expectedLabel.ModifierStartPosition {
			t.Fatalf("Index %d: Expected modifier start position %d, got %d", i, expectedLabel.ModifierStartPosition, labels[i].ModifierStartPosition)
		}
		if labels[i].ModifierEndPosition != expectedLabel.ModifierEndPosition {
			t.Fatalf("Index %d: Expected modifier end position %d, got %d", i, expectedLabel.ModifierEndPosition, labels[i].ModifierEndPosition)
		}
		if labels[i].Tag != expectedLabel.Tag {
			t.Fatalf("Index %d: Expected tag %s, got %s", i, expectedLabel.Tag, labels[i].Tag)
		}
		if labels[i].Modifier != expectedLabel.Modifier {
			t.Fatalf("Index %d: Expected modifier %s, got %s", i, expectedLabel.Modifier, labels[i].Modifier)
		}
		if labels[i].ModifierIsInt != expectedLabel.ModifierIsInt {
			t.Fatalf("Index %d: Expected modifierIsInt %t, got %t", i, expectedLabel.ModifierIsInt, labels[i].ModifierIsInt)
		}
		if labels[i].ModifierAsInt != expectedLabel.ModifierAsInt {
			t.Fatalf("Index %d: Expected modifierAsInt %d, got %d", i, expectedLabel.ModifierAsInt, labels[i].ModifierAsInt)
		}
		if labels[i].IncludesLineNumbers != expectedLabel.IncludesLineNumbers {
			t.Fatalf("Index %d: Expected IncludesLineNumbers %t, got %t", i, expectedLabel.IncludesLineNumbers, labels[i].IncludesLineNumbers)
		}
		if labels[i].LineNumber != expectedLabel.LineNumber {
			t.Fatalf("Index %d: Expected LineNumber %d, got %d", i, expectedLabel.LineNumber, labels[i].LineNumber)
		}
	}
}

func TestNumber(t *testing.T) {
	text := `
TAG-y
TAG-51
TAG-x
`

	labels := ParseLabels([]byte(text))

	expectedLabels := []ParsedLabel{
		{TagStartPosition: 1, TagEndPosition: 4, ModifierStartPosition: 5, ModifierEndPosition: 6, Tag: "TAG", Modifier: "1", ModifierIsInt: true, ModifierAsInt: 1},
		{TagStartPosition: 7, TagEndPosition: 10, ModifierStartPosition: 11, ModifierEndPosition: 13, Tag: "TAG", Modifier: "51", ModifierIsInt: true, ModifierAsInt: 51},
		{TagStartPosition: 14, TagEndPosition: 17, ModifierStartPosition: 18, ModifierEndPosition: 19, Tag: "TAG", Modifier: "2", ModifierIsInt: true, ModifierAsInt: 2},
	}

	numberedLabels := Number(labels)

	if len(numberedLabels) != len(expectedLabels) {
		t.Fatalf("Expected %d labels, got %d", len(expectedLabels), len(numberedLabels))
	}

	for i, expectedLabel := range expectedLabels {
		if numberedLabels[i].TagStartPosition != expectedLabel.TagStartPosition {
			t.Fatalf("Index %d: Expected tag start position %d, got %d", i, expectedLabel.TagStartPosition, numberedLabels[i].TagStartPosition)
		}
		if numberedLabels[i].TagEndPosition != expectedLabel.TagEndPosition {
			t.Fatalf("Index %d: Expected tag end position %d, got %d", i, expectedLabel.TagEndPosition, numberedLabels[i].TagEndPosition)
		}
		if numberedLabels[i].ModifierStartPosition != expectedLabel.ModifierStartPosition {
			t.Fatalf("Index %d: Expected modifier start position %d, got %d", i, expectedLabel.ModifierStartPosition, numberedLabels[i].ModifierStartPosition)
		}
		if numberedLabels[i].ModifierEndPosition != expectedLabel.ModifierEndPosition {
			t.Fatalf("Index %d: Expected modifier end position %d, got %d", i, expectedLabel.ModifierEndPosition, numberedLabels[i].ModifierEndPosition)
		}
		if numberedLabels[i].Tag != expectedLabel.Tag {
			t.Fatalf("Index %d: Expected tag %s, got %s", i, expectedLabel.Tag, numberedLabels[i].Tag)
		}
		if numberedLabels[i].Modifier != expectedLabel.Modifier {
			t.Fatalf("Index %d: Expected modifier %s, got %s", i, expectedLabel.Modifier, numberedLabels[i].Modifier)
		}
		if numberedLabels[i].ModifierIsInt != expectedLabel.ModifierIsInt {
			t.Fatalf("Index %d: Expected modifierIsInt %t, got %t", i, expectedLabel.ModifierIsInt, numberedLabels[i].ModifierIsInt)
		}
		if numberedLabels[i].ModifierAsInt != expectedLabel.ModifierAsInt {
			t.Fatalf("Index %d: Expected modifierAsInt %d, got %d", i, expectedLabel.ModifierAsInt, numberedLabels[i].ModifierAsInt)
		}
		if numberedLabels[i].IncludesLineNumbers != expectedLabel.IncludesLineNumbers {
			t.Fatalf("Index %d: Expected IncludesLineNumbers %t, got %t", i, expectedLabel.IncludesLineNumbers, numberedLabels[i].IncludesLineNumbers)
		}
		if numberedLabels[i].LineNumber != expectedLabel.LineNumber {
			t.Fatalf("Index %d: Expected LineNumber %d, got %d", i, expectedLabel.LineNumber, numberedLabels[i].LineNumber)
		}
	}
}

func TestApplyNumbering(t *testing.T) {
	text := []byte(`
TAG-y
TAG-51
TAG-x
`)

	expected := []byte(`
TAG-1
TAG-51
TAG-2
`)

	textWithNumberingApplied := ApplyNumbering(text, "TAG")

	if string(textWithNumberingApplied) != string(expected) {
		t.Fatalf("Expected %s, got %s", string(expected), string(textWithNumberingApplied))
	}
}
