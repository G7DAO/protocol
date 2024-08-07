# GoFP predicates

## Motivation

We can create more emersive Garden of Forking Paths sessions if our stories can place restrictions on the characters that can stake into the sessions and restrictions on the choices they can make. For example, it is reasonable to expect that characters participating in a Heelis political game should be a council member rather than a dwarf working in the mines. Or if we are playing a Troll Battle, we could require that the characters have a certain amount of agility to take evasive actions. Both of these predicates can be written by leveraging the Inventory contract. By requiring that the characters participating in certain sessions or making certain choices meet a threshold, we add more weight to the character's story (their innate characteristics, their stat allocations, their accomplishments).

## Predicate Structure

A predicate is a contract along with a function selector and initial arguments. While some of arguments we might wish to expose to the predicate can be provided by the Garden of Forking Paths session, there will likely be additional information that we wish to consider that the GoFP contract is unaware of. For example, if we require an "Evasive Maneuver" path to require 7 agility, the GoFP contract can supply the session, stage, and path, but it will not be aware of the Inventory contract being used or the slot representing agility. For this reason, we allow predicates to specify initial arguments to the predicate function in addition to the information provided by the GoFP contract.
