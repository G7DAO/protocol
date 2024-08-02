package main

import (
	"bufio"
	"bytes"
	"fmt"
	"regexp"
	"strconv"
)

// Represents a parsed label.
// A label has the form TAG-modifier - see LabelRegexp for full details.
type ParsedLabel struct {
	TagStartPosition      int
	TagEndPosition        int
	ModifierStartPosition int
	ModifierEndPosition   int
	Tag                   string
	Modifier              string
	ModifierIsInt         bool
	ModifierAsInt         int
	IncludesLineNumbers   bool
	LineNumber            int
}

// Matches all strings satisfying:
//  1. The string either has a newline or a space preceding it.
//  2. The string starts with an uppercase character or digit.
//  3. The string consists of any number of uppercase characters or digits followed by a hyphen.
//  4. The string may have any number of lowercase characters, digits, or asterisks after the hyphen.
//     Note that uppercase characters are not allowed after the hyphen as this would introduce ambiguity
//     in the definition - would an all uppercase modifier be the start of a new tag?
//
// The match completes once a non-alphanumeric character is encountered after the hyphen.
var LabelRegexp *regexp.Regexp = regexp.MustCompile(`([A-Z]+[A-Z0-9]+)-([\*a-z0-9]+)`)

// Finds all labels (as defined by LabelRegexp) in the given content.
func ParseLabels(content []byte) []ParsedLabel {
	matches := LabelRegexp.FindAllSubmatchIndex(content, -1)

	labels := make([]ParsedLabel, len(matches))

	for i, match := range matches {
		labels[i] = ParsedLabel{
			TagStartPosition:      match[2],
			TagEndPosition:        match[3],
			ModifierStartPosition: match[4],
			ModifierEndPosition:   match[5],
			Tag:                   string(content[match[2]:match[3]]),
			Modifier:              string(content[match[4]:match[5]]),
		}

		modifierAsInt, modifierParseErr := strconv.ParseInt(labels[i].Modifier, 10, 0)
		if modifierParseErr != nil {
			labels[i].ModifierIsInt = false
		} else {
			labels[i].ModifierIsInt = true
			labels[i].ModifierAsInt = int(modifierAsInt)
		}
	}

	return labels
}

// Returns the string representation of a parsed label.
func Label(p ParsedLabel) string {
	return fmt.Sprintf("%s-%s", p.Tag, p.Modifier)
}

// Finds all the labels in the given content, and also marks their line numbers.
func ParseLabelsWithLineNumbers(content []byte) []ParsedLabel {
	contentReader := bytes.NewReader(content)
	scanner := bufio.NewScanner(contentReader)

	labels := []ParsedLabel{}

	currentLine := 0
	for scanner.Scan() {
		currentLine++
		lineLabels := ParseLabels(scanner.Bytes())
		for _, lineLabel := range lineLabels {
			lineLabel.IncludesLineNumbers = true
			lineLabel.LineNumber = currentLine
			labels = append(labels, lineLabel)
		}
	}

	return labels
}

// Groups the labels in the given content by their tags.
// If lines = true, parses labels relative to its line in the content, otherwise parses absolutely.
func ParseTags(content []byte, lines bool) map[string][]ParsedLabel {
	var labels []ParsedLabel
	if lines {
		labels = ParseLabelsWithLineNumbers(content)
	} else {
		labels = ParseLabels(content)
	}

	tagIndex := make(map[string][]ParsedLabel)

	for _, label := range labels {
		if _, ok := tagIndex[label.Tag]; !ok {
			tagIndex[label.Tag] = []ParsedLabel{}
		}
		tagIndex[label.Tag] = append(tagIndex[label.Tag], label)
	}

	return tagIndex
}

// Numbers all un-numbered labels in the given slice.
// A label is considered unnumbered if its modifier is not an integer.
// If some labels are already numbered, they are not touched.
// This function packs the numbering so that there are no gaps introduced in the final set of numbers assigned
// over all instances of the labels with the given tag.
// If a label with the given tag has a modifier which is larger than the total number of labels with
// the given tag, then that could create a gap. graffiti does not renumber already numbered labels.
// Note that the modifier end positions in the resulting labels reflect the pre-numbering positions.
func Number(labels []ParsedLabel) []ParsedLabel {
	existingNumbers := map[int]bool{}

	numberedLabels := make([]ParsedLabel, len(labels))

	for _, label := range labels {
		if label.ModifierIsInt {
			existingNumbers[label.ModifierAsInt] = true
		}
	}

	currentNumber := 1
	for i, label := range labels {
		if label.ModifierIsInt {
			numberedLabels[i] = ParsedLabel{
				TagStartPosition:      label.TagStartPosition,
				TagEndPosition:        label.TagEndPosition,
				ModifierStartPosition: label.ModifierStartPosition,
				ModifierEndPosition:   label.ModifierEndPosition,
				Tag:                   label.Tag,
				Modifier:              label.Modifier,
				ModifierIsInt:         label.ModifierIsInt,
				ModifierAsInt:         label.ModifierAsInt,
				IncludesLineNumbers:   label.IncludesLineNumbers,
				LineNumber:            label.LineNumber,
			}
		} else {
			for existingNumbers[currentNumber] {
				currentNumber++
			}
			numberedLabels[i] = ParsedLabel{
				TagStartPosition:      label.TagStartPosition,
				TagEndPosition:        label.TagEndPosition,
				ModifierStartPosition: label.ModifierStartPosition,
				ModifierEndPosition:   label.ModifierEndPosition,
				Tag:                   label.Tag,
				Modifier:              fmt.Sprintf("%d", currentNumber),
				ModifierIsInt:         true,
				ModifierAsInt:         currentNumber,
				IncludesLineNumbers:   label.IncludesLineNumbers,
				LineNumber:            label.LineNumber,
			}
			currentNumber++
		}
	}

	return numberedLabels
}

// Takes content and a tag, calculates a numbering for all labels with the given tag, and replaces
// all unnumbered labels with their numbered counterparts.
// Makes a copy of the original content and applies the numbering to that copy. Original content remains
// unmodified.
func ApplyNumbering(content []byte, tag string) []byte {
	updatedContent := make([]byte, len(content))
	copy(updatedContent, content)

	tagLabels := ParseTags(content, false)
	labels, ok := tagLabels[tag]
	if !ok {
		return content
	}
	numberedLabels := Number(labels)
	// We iterate backwards since each substitution we make will affect *subsequent* position indices
	// in the content.
	for i := len(numberedLabels) - 1; i >= 0; i-- {
		label := numberedLabels[i]
		updatedContent = append(updatedContent[:label.ModifierStartPosition], append([]byte(label.Modifier), updatedContent[label.ModifierEndPosition:]...)...)
	}

	return updatedContent
}

// Indexes all labels parsed from the given content by their string representations.
func Match(content []byte, tag string, lines bool) map[string][]ParsedLabel {
	var contentLabels []ParsedLabel
	if lines {
		contentLabels = ParseLabelsWithLineNumbers(content)
	} else {
		contentLabels = ParseLabels(content)
	}

	contentMatches := map[string][]ParsedLabel{}
	for _, label := range contentLabels {
		if label.Tag == tag {
			if _, ok := contentMatches[Label(label)]; !ok {
				contentMatches[Label(label)] = []ParsedLabel{}
			}
			contentMatches[Label(label)] = append(contentMatches[Label(label)], label)
		}
	}

	return contentMatches
}
